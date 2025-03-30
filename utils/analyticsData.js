const { formatDateMMDD } = require('./batch-single/formatDate');

class AnalyticsData {
	constructor(data) {
		this.data = data ?? {
			sevenDays: {},
			twentyEightDays: {},
			totalPageviews: 0,
			uniqueVisitors: 0,
			totalPresaves: 0,
			taps: [],
			referrers: [],
			locations: [],
			visitors: [],
			cities: [],
			countries: [],
			dailyBreakdowns: {},
		};
		this.differenceInCalendarDays = (date1, date2) => {
			const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
			return Math.round(Math.abs((date1 - date2) / oneDay));
		};
		this.isSameDay = (date1, date2) => {
			return formatDateMMDD(date1) === formatDateMMDD(date2);
		};
	}

	addView(eventDate, visitorId, referrer = null, city = null, country = null) {
		const todayDate = new Date();
		const formattedDate = formatDateMMDD(eventDate);

		// Initialize daily breakdown if not exists
		if (!this.data.dailyBreakdowns[formattedDate]) {
			this.data.dailyBreakdowns[formattedDate] = {
				views: 0,
				taps: {},
				cities: {},
				country: {},
				visitors: {},
				referrers: {},

				totalTaps: 0,
				totalCities: 0,
				totalReferrer: 0,
				uniqueVisitors: 0,
				totalCountries: 0,
			};
		}

		const dailyData = this.data.dailyBreakdowns[formattedDate];

		// Add visitor if not already counted
		if (!dailyData.visitors[visitorId]) {
			dailyData.visitors[visitorId] = 1;
			dailyData.uniqueVisitors += 1;
			this.data.uniqueVisitors += 1;
		} else {
			dailyData.visitors[visitorId] += 1;
		}

		// Increment views
		dailyData.views += 1;
		this.data.totalPageviews += 1;

		// Handle referrer if provided
		if (referrer) {
			if (Array.isArray(dailyData.referrers) || !dailyData.referrers) {
				dailyData.referrers = {};
			}
			dailyData.referrers[referrer] = (dailyData.referrers[referrer] ?? 0) + 1;
		}

		// Handle city if provided
		if (city) {
			if (Array.isArray(dailyData.cities) || !dailyData.cities) {
				dailyData.cities = {};
			}
			dailyData.cities[city] = (dailyData.cities[city] ?? 0) + 1;
		}

		// Handle country if provided
		if (country) {
			if (Array.isArray(dailyData.countries) || !dailyData.countries) {
				dailyData.countries = {};
			}
			dailyData.countries[country] = (dailyData.countries[country] ?? 0) + 1;
		}

		// Update time period stats if not today

		// this.updateAggregatedStats();
	}

	addTap(eventDate, providerTapped) {
		const formattedDate = formatDateMMDD(eventDate);

		// Initialize daily breakdown if not exists
		if (!this.data.dailyBreakdowns[formattedDate]) {
			this.data.dailyBreakdowns[formattedDate] = {
				views: 0,
				taps: {},
				cities: {},
				country: {},
				visitors: {},
				referrers: {},

				totalTaps: 0,
				totalCities: 0,
				totalReferrer: 0,
				uniqueVisitors: 0,
				totalCountries: 0,
			};
		}

		const dailyData = this.data.dailyBreakdowns[formattedDate];

		// Update tap counts
		dailyData.taps[providerTapped] = (dailyData.taps[providerTapped] || 0) + 1;
		dailyData.totalTaps += 1;

		// Update main taps data
		// const totalTapItem = this.data.taps.find(item => item.value.key === 'total');
		// if (totalTapItem) {
		// 	totalTapItem.value.value += 1;
		// }

		// Update max taps if needed
		// const maxTapItem = this.data.taps.find(item => item.value.key === 'max');
		// if (maxTapItem && maxTapItem.value.value < dailyData.totalTaps) {
		// 	maxTapItem.value.value = dailyData.totalTaps;
		// }

		// Update time period stats if not today
		// if (!this.isSameDay(eventDate, todayDate)) {
		// 	const diffDays = this.differenceInCalendarDays(todayDate, eventDate);
		// 	const isTwentyEightDays = diffDays > 6;

		// 	const tapRecord = {
		// 		provider: providerTapped,
		// 		date: eventDate,
		// 	};

		// 	if (isTwentyEightDays) {
		// 		this.data.twentyEightDays.taps.push(tapRecord);
		// 	} else {
		// 		this.data.sevenDays.taps.push(tapRecord);
		// 	}
		// }
		// this.updateAggregatedStats();
	}

	updateAggregatedStats() {
		const now = new Date();

		// Calculate sevenDays stats
		const sevenDaysCutoff = new Date(now);
		sevenDaysCutoff.setDate(sevenDaysCutoff.getDate() - 7);

		// Calculate twentyEightDays stats
		const twentyEightDaysCutoff = new Date(now);
		twentyEightDaysCutoff.setDate(twentyEightDaysCutoff.getDate() - 28);

		let sevenDaysStats = {
			taps: [],
			cities: [],
			referrers: [],
			locations: [],
			countries: [],
			avgSession: 0,
			liveVisitors: 0,
			bounceRate: 0,
			uniqueVisitors: 0,
			views: 0,
			visitors: new Set(),
		};

		let twentyEightDaysStats = {
			taps: [],
			cities: [],
			referrers: [],
			locations: [],
			countries: [],
			avgSession: 0,
			liveVisitors: 0,
			bounceRate: 0,
			uniqueVisitors: 0,
			views: 0,
			visitors: new Set(),
		};

		// Process all daily breakdowns
		for (const [dateStr, dailyData] of Object.entries(this.data.dailyBreakdowns)) {
			const date = new Date(dateStr);

			if (date >= sevenDaysCutoff) {
				sevenDaysStats.views += dailyData.views || 0;
				Object.keys(dailyData.visitors || {}).forEach(v => sevenDaysStats.visitors.add(v));

				// Add taps
				Object.entries(dailyData.taps || {}).forEach(([provider, count]) => {
					sevenDaysStats.taps.push({ provider, date, count });
				});
			}

			if (date >= twentyEightDaysCutoff) {
				twentyEightDaysStats.views += dailyData.views || 0;
				Object.keys(dailyData.visitors || {}).forEach(v => twentyEightDaysStats.visitors.add(v));

				// Add taps
				Object.entries(dailyData.taps || {}).forEach(([provider, count]) => {
					twentyEightDaysStats.taps.push({ provider, date, count });
				});
			}
		}

		// Finalize stats
		sevenDaysStats.uniqueVisitors = sevenDaysStats.visitors.size;
		twentyEightDaysStats.uniqueVisitors = twentyEightDaysStats.visitors.size;

		// Calculate bounce rates (simplified example)
		sevenDaysStats.bounceRate = this.calculateBounceRate(7);
		twentyEightDaysStats.bounceRate = this.calculateBounceRate(28);

		// Update the data object
		this.data.sevenDays = {
			...sevenDaysStats,
			visitors: Array.from(sevenDaysStats.visitors),
		};

		this.data.twentyEightDays = {
			...twentyEightDaysStats,
			visitors: Array.from(twentyEightDaysStats.visitors),
		};
	}

	calculateBounceRate(days) {
		// Simplified bounce rate calculation
		// In a real implementation, you'd track single-page visits
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - days);

		let singlePageVisits = 0;
		let totalVisits = 0;

		for (const [dateStr, dailyData] of Object.entries(this.data.dailyBreakdowns)) {
			const date = new Date(dateStr);
			if (date >= cutoff) {
				totalVisits += dailyData.views || 0;
				// This is simplified - you'd need to track actual bounce behavior
				singlePageVisits += Object.keys(dailyData.visitors || {}).length;
			}
		}

		return totalVisits > 0 ? Math.round((singlePageVisits / totalVisits) * 100) : 0;
	}
}

module.exports = { AnalyticsData };
