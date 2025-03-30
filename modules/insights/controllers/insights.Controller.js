const { getFantumInsights, getInsightByLinkId } = require('../services/insights.Service');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const getUsersLinks = require('../../../utils/firebase/getUsersLinks');
const { BatchSingle } = require('../../../utils/batch-single');
const { migrateInsightsLive } = require('../../../utils/pushLocal');
const { cacheInstance } = require('../../../utils/batch-single/cache');
const { formatDateMMDD } = require('../../../utils/batch-single/formatDate');
const { BatchGetEvents, BatchGetEventsWith1MINInterval, processSingleEvent } = require('../../../utils/insights');
const { processOneToJson } = require('../../../utils/insightsNew');
const { InsightProcessor } = require('../../../utils/batch-single/insightsProcessor');
const { fireStore } = require('../../../config/firestore');
const { AnalyticsData } = require('../../../utils/analyticsData');
const getLinkInsights = async (req, res) => {
	try {
		const { id: userId } = req.query;
		console.log(req.query, userId);

		if (!userId) {
			return res.status(400).json({ error: 'no id query' });
		}

		const insights = {};
		const links = await getUsersLinks(userId);

		for (const link of links) {
			const { id } = link;
			const ins = await getInsightByLinkId(link.id);
			insights[id] = {
				...ins,
			};
		}

		// const insights = await getFantumInsights();
		res.status(200).json({
			message: 'Success',
			insights: insights ?? null,
		});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({ error: error.message });
	}
};
const getAllInsights = async (req, res) => {
	const interval = req.body.interval ?? undefined;
	try {
		const insights = await getFantumInsights({ interval });
		await migrateInsightsLive(insights);
		res.status(200).json({
			message: 'Insights retrieved successfully',
			insights: insights ?? 'none',
			insightsLength: Object.keys(insights)?.length ?? 0,
		});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({ error: error.message });
	}
};

const sync = async () => {
	const now = Date.now();

	const todayStringKey = formatDateMMDD(now);

	const { data: insights, errorred } = await BatchGetEventsWith1MINInterval();

	if (errorred) {
		console.log('err');
		return 'err';
	}

	const fetchedCache = {};

	for (const insight of insights) {
		const processedObj = processOneToJson(insight); //await processor.processEvent(insight, { remote: true });
		const key = Object.keys(processedObj)[0];
		const processed = { ...processedObj[key], id: key };
		// console.log({ processed });

		let oldData = {};
		const InsightRef = fireStore.collection('insights').doc(key);
		if (fetchedCache[key]) {
			oldData = { ...fetchedCache[key] };
		} else {
			const _oldData = await InsightRef.get();
			oldData = _oldData.data();
			if (_oldData.exists) {
				fetchedCache[key] = oldData;
			} else {
				fetchedCache[key] = {};
			}
		}

		if (processed.id) {
			const date = formatDateMMDD(insight.timestamp);
			console.log({ oldData });

			const adata = new AnalyticsData(oldData);
			const vId = insight.distinct_id;
			const city = insight.properties?.$geoip_city_name || 'unknown city';
			const country = insight.properties?.$geoip_country_name || 'unknown country';
			const referrer = insight.properties?.$referrer;

			if (insight.event == 'PAGE-VIEW-V2') {
				adata.addView(date, vId, referrer, city, country);
			}
			if (insight.event == 'PROVIDER-CLICK-V2' || insight.event == 'PROVIDER-ClICK-V2') {
				const providerTapped = insight.properties?.fantumProviderTapped || 'unknown-provider';
				adata.addTap(date, providerTapped);
			}

			console.log(adata.data);
			fetchedCache[key] = adata.data;
			await InsightRef.set(adata.data, { merge: true });
			await cacheInstance.set(fetchedCache);
		}
	}
};

const BATCH_SIZE = 5;
const uploadFromCSV = async (req, res) => {
	const processor = new InsightProcessor(cacheInstance);
	try {
		const filePath = path.join(__dirname, '29th.csv');
		const batch = [];
		let count = 0;
		let PAGEVIEWV2 = 0;
		let PROVIDERClICKV2 = 0;
		let pageview = 0;

		const stream = fs
			.createReadStream(filePath)
			.pipe(csv())
			.on('data', async data => {
				const compiledResult = {};
				const uniqueEntries = new Set();
				for (const key in data) {
					if (!data[key].trim()) continue; // Ignore empty values

					// ✅ Clean key: Remove leading `*.` and trim spaces
					const cleanKey = key.replace(/^\*\./, '').trim();
					const keys = cleanKey.split('.');

					// ✅ Nest keys properly
					let current = compiledResult;
					for (let i = 0; i < keys.length; i++) {
						const part = keys[i].trim();
						if (part == '$raw_user_agent') {
							current[part] = '';
						}
						if (i === keys.length - 1) {
							current[part] = data[key].trim(); // Assign final value
						} else {
							current[part] = current[part] || {}; // Create nested object
							current = current[part];
						}
					}
				}

				const resultString = JSON.stringify(compiledResult);
				if (!uniqueEntries.has(resultString)) {
					uniqueEntries.add(resultString);
					if (compiledResult.event == 'PAGE-VIEW-V2' || compiledResult.event == 'PROVIDER-ClICK-V2') {
						batch.push(compiledResult); //{ ...compiledResult['*'], uuid: compiledResult.uuid }
					}
				}
				count++;
				if (compiledResult.event == 'PAGE-VIEW-V2') {
					PAGEVIEWV2++;
				}
				if (compiledResult.event == '$pageview') {
					pageview++;
				}

				if (compiledResult.event == 'PROVIDER-ClICK-V2') {
					PROVIDERClICKV2++;
				}
				console.log(count, pageview, PAGEVIEWV2, PROVIDERClICKV2);

				if (batch.length >= BATCH_SIZE) {
					// if (count == 10) {
					// 	console.log(JSON.stringify(batch[0]));
					// }
					stream.pause();
					batch.forEach(async event => await processor.processEvent(event));
					batch.length = 0;
					stream.resume();
				}
			})
			.on('end', async () => {
				console.log('batch length', batch.length);

				if (batch.length > 0) {
					batch.forEach(async event => await BatchSingle(event, count));
				}
				res.status(200).json({ message: 'Insights processed successfully' });
			})
			.on('error', err => {
				console.error('CSV processing error:', err);
				res.status(500).json({ error: 'CSV processing failed' });
			});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({ error: error.message });
	}
};

module.exports = { getAllInsights, uploadFromCSV, getLinkInsights, sync };

async function getInsightsOf(id) {
	const InsightRef = fireStore.collection('insights').doc(insight.id);
	const InsightData = await InsightRef.get();
	return InsightData.data();
}

/*
expects raw json Insight
*/
async function upload(insight, unique) {
	const InsightRef = fireStore.collection('insights').doc(insight.id);
	const _oldData = await InsightRef.get();
	const oldData = _oldData.data();
	const newData = processDocumentData(insight);

	let merged = {};

	if (_oldData.exists) {
		merged = { ...mergeAnalytics(oldData, newData) };
	} else {
		merged = { ...newData, uniqueVisitors: oldData.uniqueVisitors + (unique ? 1 : 0) };
	}

	await InsightRef.set(merged, { merge: true });
}

/*
expects 2 firestore ready Insight
*/
function mergeAnalytics(obj1, obj2) {
	function mergeArrays(arr1, arr2) {
		const map = new Map();
		[...arr1, ...arr2].forEach(item => {
			const key = item.key;
			if (!map.has(key)) {
				map.set(key, { ...item });
			} else {
				map.get(key).value.value += item.value.value;
			}
		});
		return Array.from(map.values());
	}

	function mergeObjects(o1, o2) {
		const result = { ...o1 };

		for (const key in o2) {
			if (o2.hasOwnProperty(key)) {
				if (key === 'dailyBreakdowns') {
					// Handle merging of daily breakdowns separately
					result[key] = mergeDailyBreakdowns(o1[key] || {}, o2[key] || {});
				} else if (o1[key] && typeof o1[key] === 'object' && typeof o2[key] === 'object' && !Array.isArray(o1[key])) {
					result[key] = mergeObjects(o1[key], o2[key]);
				} else if (Array.isArray(o1[key]) && Array.isArray(o2[key])) {
					result[key] = mergeArrays(o1[key], o2[key]);
				} else if (typeof o1[key] === 'number' && typeof o2[key] === 'number') {
					result[key] = o1[key] + o2[key];
				} else {
					result[key] = o2[key];
				}
			}
		}

		console.log({ o1, o2, result });

		return result;
	}

	function mergeDailyBreakdowns(db1, db2) {
		const merged = { ...db1 };

		for (const date in db2) {
			if (db2.hasOwnProperty(date)) {
				if (!merged[date]) {
					merged[date] = { ...db2[date] };
				} else {
					merged[date] = {
						visitors: { ...merged[date].visitors, ...db2[date].visitors },
						totalTaps: (merged[date].totalTaps || 0) + (db2[date].totalTaps || 0),
						taps: { ...merged[date].taps, ...db2[date].taps },
						uniqueVisitors: (merged[date].uniqueVisitors || 0) + (db2[date].uniqueVisitors || 0),
						views: (merged[date].views || 0) + (db2[date].views || 0),
					};
				}
			}
		}

		return merged;
	}

	return mergeObjects(obj1, obj2);
}

function processDocumentData(data) {
	return {
		// Flatten main metrics
		totalPageviews: data.totalPageviews || 0,
		uniqueVisitors: data.uniqueVisitors || 0,
		totalPresaves: data.totalPresaves || 0,

		// Convert nested objects to array structures
		taps: convertToArray(data.taps),
		referrers: convertToArray(data.referrers),
		locations: convertToArray(data.locations),
		cities: convertToArray(data.cities),
		countries: convertToArray(data.countries),

		// Convert daily breakdowns to timestamped array
		dailyBreakdowns: data.dailyBreakdowns,

		// Convert time-period metrics
		sevenDays: convertPeriodData(data.sevenDays),
		twentyEightDays: convertPeriodData(data.twentyEightDays),

		// Add metadata
		// lastUpdated: fireStore.FieldValue.serverTimestamp(),
	};
}

function convertToArray(obj) {
	return Object.entries(obj || {}).map(([key, value]) => ({ key, value }));
}

function convertPeriodData(period) {
	return {
		views: period?.views || 0,
		uniqueVisitors: period?.uniqueVisitors || 0,
		liveVisitors: period?.liveVisitors || 0,
		bounceRate: period?.bounceRate || 0,
		avgSession: period?.avgSession || 0,
		taps: convertToArray(period?.taps?.counts),
		countries: convertToArray(period?.countries?.counts),
		cities: convertToArray(period?.cities?.counts),
		locations: convertToArray(period?.locations?.counts),
		referrers: convertToArray(period?.referrers?.counts),
	};
}
