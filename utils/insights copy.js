// 'use strict'

const { default: axios } = require('axios');
const updateInsights = require('./firebase/updateInsights');
const Query = require('../config/queries');
const { FileLog } = require('./fileLog');

// helper functions
function getBounceRate(views, clicks) {
	return (views - clicks) / views;
}
function formatDateMMDD(timestamp) {
	const date = new Date(timestamp);
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: '2-digit',
	});
}
function sortRawPostHogDataIntoColumns(data) {
	return data.results.reduce((acc, row) => {
		if (!acc) acc = [];
		const event = {};
		data.columns.forEach((col, i) => {
			if (col == 'properties') {
				event[col] = JSON.parse(row[i]);
			} else {
				event[col] = row[i];
			}
		});
		acc.push(event);

		return acc;
	}, []);
}

// get insights from remote
async function BatchGetEvents(interval) {
	const url = process.env.INSIGHTS_ENDPOINT;
	const token = process.env.INSIGHTS_TOKEN;

	const headers = {
		Authorization: `Bearer ${token}`,
		'Content-Type': 'application/json',
	};
	const payload = {
		query: { kind: 'HogQLQuery', query: Query('ALL', interval) },
	};
	try {
		const response = await axios.post(url, payload, { headers });
		return sortRawPostHogDataIntoColumns(response.data);
	} catch (err) {
		throw new Error(err);
	}
}

// process single 'row' [ csv use ]
const processSingleEvent = async event => {
	const groupedData = {};

	const songId = event.properties?.fantumSmartLinkId;
	const distinctId = event.distinct_id;
	const day = formatDateMMDD(event.timestamp);

	const city = event.properties?.$geoip_city_name || 'unknown city';
	const country = event.properties?.$geoip_country_name || 'unknown country';
	const location = `${city}, ${country}`;
	const referrer = event.properties?.$referrer;

	if (!songId) return;

	// Ensure groupedData[songId] exists
	if (!groupedData[songId]) {
		groupedData[songId] = {
			totalPageviews: 0,
			uniqueVisitors: 0,
			totalPresaves: 0,
			taps: {},
			referrers: {},
			locations: {},
			visitors: {},
			cities: {},
			countries: {},
			dailyBreakdowns: {}, // ✅ Ensure dailyBreakdowns exists here
		};
	}

	// Ensure dailyBreakdowns[day] exists
	if (!groupedData[songId].dailyBreakdowns[day]) {
		groupedData[songId].dailyBreakdowns[day] = {
			taps: {},
			totalTaps: 0,

			views: 0,
			distinctViews: 0,
			visitors: {},

			referer: {},
			totalReferer: 0,

			locations: {},
			countries: {},
			cities: {},

			totalLocations: 0,
		};
	}

	// Process event
	if (event.event === 'PAGE-VIEW-V2') {
		groupedData[songId].totalPageviews++;
		groupedData[songId].dailyBreakdowns[day].views++;

		if (!groupedData[songId].visitors[distinctId]) {
			groupedData[songId].uniqueVisitors++;
			groupedData[songId].visitors[distinctId] = 1;
		} else {
			groupedData[songId].visitors[distinctId]++;
		}

		if (!groupedData[songId].dailyBreakdowns[day].visitors[distinctId]) {
			groupedData[songId].dailyBreakdowns[day].distinctViews++;
			groupedData[songId].dailyBreakdowns[day].visitors[distinctId] = 1;
		} else {
			groupedData[songId].dailyBreakdowns[day].visitors[distinctId]++;
		}
	} else if (event.event === 'PROVIDER-ClICK-V2') {
		const providerTapped = event.properties?.fantumProviderTapped || 'unknown-provider';

		groupedData[songId].taps[providerTapped] = (groupedData[songId].taps[providerTapped] || 0) + 1;

		groupedData[songId].dailyBreakdowns[day].taps[providerTapped] = (groupedData[songId].dailyBreakdowns[day].taps?.[providerTapped] || 0) + 1;
	}

	if (referrer) {
		groupedData[songId].dailyBreakdowns[day].referer[referrer] = (groupedData[songId].dailyBreakdowns[day].referer[referrer] || 0) + 1;
		groupedData[songId].referrers[referrer] = (groupedData[songId].referrers[referrer] || 0) + 1;
	}

	if (location) {
		groupedData[songId].locations[location] = (groupedData[songId].locations[location] || 0) + 1;
	}
	if (country) {
		groupedData[songId].countries[country] = (groupedData[songId].countries[country] || 0) + 1;
	}
	if (city) {
		groupedData[songId].cities[city] = (groupedData[songId].cities[city] || 0) + 1;
	}

	// Process the grouped data (e.g., store it in a DB, etc.)
	await updateInsights(groupedData);
	// console.log(groupedData);
	// throw Error;
};

// process pageViews
const processPageView = (groupedData, songId, distinctId, day) => {
	groupedData[songId].totalPageviews++;
	groupedData[songId].dailyBreakdowns[day].views++;

	if (!groupedData[songId].visitors[distinctId]) {
		groupedData[songId].uniqueVisitors++;
		groupedData[songId].visitors[distinctId] = 1;
	} else {
		groupedData[songId].visitors[distinctId]++;
	}

	if (!groupedData[songId].dailyBreakdowns[day].visitors[distinctId]) {
		groupedData[songId].dailyBreakdowns[day].distinctViews++;
		groupedData[songId].dailyBreakdowns[day].visitors[distinctId] = 1;
	} else {
		groupedData[songId].dailyBreakdowns[day].visitors[distinctId]++;
	}
};
// process providerClicks
const processProviderClick = (groupedData, songId, providerTapped, day) => {
	groupedData[songId].totalTaps++;
	groupedData[songId].taps[providerTapped] = (groupedData[songId].taps[providerTapped] || 0) + 1;
	groupedData[songId].dailyBreakdowns[day].taps[providerTapped] = (groupedData[songId].dailyBreakdowns[day].taps[providerTapped] || 0) + 1;

	groupedData[songId].bounceRate = groupedData[songId].totalPageviews
		? getBounceRate(groupedData[songId].totalPageviews, groupedData[songId].totalTaps)
		: 0;
};

// process meta
const processMetadata = (groupedData, songId, day, referrer, location, country, city) => {
	if (referrer) {
		groupedData[songId].dailyBreakdowns[day].referer[referrer] = (groupedData[songId].dailyBreakdowns[day].referer[referrer] || 0) + 1;
		groupedData[songId].referrers[referrer] = (groupedData[songId].referrers[referrer] || 0) + 1;
	}

	if (location) {
		groupedData[songId].locations[location] = (groupedData[songId].locations[location] || 0) + 1;
	}
	if (country) {
		groupedData[songId].countries[country] = (groupedData[songId].countries[country] || 0) + 1;
	}
	if (city) {
		groupedData[songId].cities[city] = (groupedData[songId].cities[city] || 0) + 1;
	}
};

// init track default [ per unique track ]
const initializeSongData = (groupedData, songId) => {
	if (!groupedData[songId]) {
		groupedData[songId] = {
			bounceRate: 0,
			totalPageviews: 0,
			uniqueVisitors: 0,
			totalPresaves: 0,
			totalTaps: 0,
			taps: {},
			referrers: {},
			locations: {},
			visitors: {},
			cities: {},
			countries: {},
			dailyBreakdowns: {},
		};
	}
};

// init day default
const initializeDailyBreakdown = (groupedData, songId, day) => {
	if (!groupedData[songId].dailyBreakdowns[day]) {
		groupedData[songId].dailyBreakdowns[day] = {
			taps: {},
			totalTaps: 0,
			views: 0,
			distinctViews: 0,
			visitors: {},
			referer: {},
			totalReferer: 0,
			locations: {},
			countries: {},
			cities: {},
			totalLocations: 0,
		};
	}
};

const BatchProcessData = async events => {
	const groupedData = {};

	events?.forEach(event => {
		const songId = event.properties?.fantumSmartLinkId;
		if (!songId) return;

		const distinctId = event.distinct_id;
		const day = formatDateMMDD(event.timestamp);

		const city = event.properties?.$geoip_city_name || 'unknown city';
		const country = event.properties?.$geoip_country_name || 'unknown country';
		const location = `${city}, ${country}`;
		const referrer = event.properties?.$referrer;

		initializeSongData(groupedData, songId);
		initializeDailyBreakdown(groupedData, songId, day);

		if (event.event === 'PAGE-VIEW-V2') {
			processPageView(groupedData, songId, distinctId, day);
		} else if (event.event === 'PROVIDER-ClICK-V2') {
			const providerTapped = event.properties?.fantumProviderTapped || 'unknown-provider';
			processProviderClick(groupedData, songId, providerTapped, day);
		} else {
			return;
		}

		processMetadata(groupedData, songId, day, referrer, location, country, city);
	});

	await updateInsights(groupedData);
	FileLog(groupedData);
	return groupedData;
};
module.exports = {
	processSingleEvent,
	BatchProcessData,
	BatchGetEvents,
};
