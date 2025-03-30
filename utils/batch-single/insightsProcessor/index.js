const fs = require('fs');
const path = require('path');
const date = require('date-fns');
const { calculateBounceRate } = require('../calculateBounceRate');
const { processAndHandleIinsights } = require('../processAndHandleIinsights');
const { cacheInstance } = require('../cache');
const updateInsights = require('../../firebase/updateInsights');
const { AnalyticsData } = require('../../analyticsData');
const { formatDateMMDD } = require('../formatDate');
const { processOneToJson } = require('../../insightsNew');

module.exports.InsightProcessor = class {
	constructor() {
		this.cache = new Map();
		this.debounceTimeout = null;
		this.isProcessing = false;
		this.cacheStore = cacheInstance;
	}

	async clearFile() {
		await this.cacheStore.clear();
	}

	async processEvent(event, options) {
		const processed = processAndHandleIinsights(event);
		if (!processed) {
			console.log('Event could not be processed:');
			return; //throw new Error('issue o could not process event: ' + JSON.stringify(event));
		}

		if (options?.remote) {
			return processed;
		}

		if (!options) {
			const old = await this.cache.get(processed.id);
			console.log('Old data found');

			this.cache.set(processed.id, this.mergeCacheData(old, processed));

			// Debounce save operations
			clearTimeout(this.debounceTimeout);
			this.debounceTimeout = setTimeout(async () => {
				try {
					if (this.isProcessing) return;
					this.isProcessing = true;
					console.log('Saving data to JSON...');
					await this.pushToJson();
					console.log('Data saved to JSON.');
				} catch (error) {
					console.error('Error in debounced pushToJson:', error);
				} finally {
					this.isProcessing = false;
				}
			}, 1000);
		}

		return processed;
	}

	async pushToJson() {
		try {
			const existing = await this.cacheStore.get();

			const merged = Array.from(this.cache.values()).reduce(
				(acc, curr) => ({
					...acc,
					[curr.id]: this.mergeCacheData(acc[curr.id], curr),
				}),
				existing
			);

			await this.cacheStore.set(merged);
			this.cache.clear();
		} catch (error) {
			console.error('Data persistence error:', error);
		}
	}

	mergeCacheData(existing, incoming) {
		// console.log({ existing, incoming });

		// if (!existing) return incoming;
		const merger = (target, source) => {
			Object.entries(source).forEach(([key, value]) => {
				if (key === 'visitors' || key === 'uniqueVisitors') {
					// Handle unique visitors properly
					const combined = {
						...target[key],
						...value,
					};
					target[key] = combined;
					target.uniqueVisitors = Object.keys(combined).length;
				} else if (typeof value === 'object' && value !== null) {
					if (!target[key]) target[key] = Array.isArray(value) ? [] : {};
					merger(target[key], value);
				} else if (typeof value === 'number') {
					target[key] = (target[key] || 0) + value;
				} else {
					target[key] = value;
				}
			});
		};

		const merged = existing ? { ...existing } : { ...incoming };
		merger(merged, incoming);

		// if (merged.sevenDays.uniqueViewCount == 0) {
		const twentyEightDays = Object.keys(merged.twentyEightDays.visitors).length;
		const sevenDays = Object.keys(merged.sevenDays.visitors).length;

		Object.keys(merged.dailyBreakdowns).forEach(day => {
			const uniqueVisitors = Object.keys(merged.dailyBreakdowns[day].visitors).length;
			const views = merged.dailyBreakdowns[day].views;
			const bounce = calculateBounceRate(uniqueVisitors, views);
			merged.dailyBreakdowns[day].bounceRate = bounce;
			merged.dailyBreakdowns[day].uniqueVisitors = uniqueVisitors;
			console.log({ bounce, uniqueVisitors, views });
			console.log(merged.dailyBreakdowns[day].visitors);
		});
		merged.twentyEightDays.bounceRate = calculateBounceRate(twentyEightDays, merged.twentyEightDays.views);
		merged.sevenDays.bounceRate = calculateBounceRate(sevenDays, merged.sevenDays.views);
		// }

		return merged;
	}

	// Add cleanup method
	cleanup() {
		if (this.debounceTimeout) {
			clearTimeout(this.debounceTimeout);
			this.debounceTimeout = null;
		}
		this.cache.clear();
	}
};

function process(data) {
	const date = formatDateMMDD(data.timestamp);
	const otherForm = processOneToJson(data);
	const adata = new AnalyticsData(otherForm);
	const vId = data.distinct_id;
	const city = data.properties?.$geoip_city_name || 'unknown city';
	const country = data.properties?.$geoip_country_name || 'unknown country';
	const referrer = data.properties?.$referrer;

	if (data.event == 'PAGE-VIEW-V2') {
		adata.addView(date, vId, referrer, city, country);
	}
	if (data.event == 'PROVIDER-CLICK-V2' || data.event == 'PROVIDER-ClICK-V2') {
		const providerTapped = data.properties?.fantumProviderTapped || 'unknown-provider';
		adata.addTap(date, providerTapped);
	}

	return adata.data;
}
