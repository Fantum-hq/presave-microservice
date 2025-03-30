// 'use strict'

const { default: axios } = require('axios');
const fs = require('fs');
const path = require('path');
const updateInsights = require('./firebase/updateInsights');
const Query = require('../config/queries');
const { group } = require('console');
const date = require('date-fns');

const _def_data = {
	taps: {},
	totalTaps: 0,

	views: 0,
	distinctViews: 0,

	referer: {},
	totalReferer: 0,

	locations: {},
	countries: {},
	cities: {},

	totalLocations: 0,
};

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
	console.log('formating...', data.results.length, ' results');
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
		console.log(err);
		throw err;
	}
}

async function BatchGetEventsWith1MINInterval() {
	const url = process.env.INSIGHTS_ENDPOINT;
	const token = process.env.INSIGHTS_TOKEN;

	const headers = {
		Authorization: `Bearer ${token}`,
		'Content-Type': 'application/json',
	};

	// robotics decoupling, ev cars, solar.
	// AND properties.$host = 'devity.ftu.me'

	const payload = {
		query: {
			kind: 'HogQLQuery',
			query: `
			SELECT uuid,event,distinct_id,properties.$pathname AS pathname,properties AS properties,properties.$host AS host,properties.providerTapped AS provider_tapped,properties.$referrer AS referrer,properties.$geoip_city_name AS city,properties.$geoip_country_name AS country,properties.$current_url AS current_url,timestamp FROM events WHERE event IN ('PROVIDER-CLICK-V2','PROVIDER-ClICK-V2', 'PAGE-VIEW-V2') 
			AND timestamp >= NOW() - INTERVAL 1 MINUTE
			ORDER BY timestamp DESC
			`,
		},
	};
	try {
		const response = await axios.post(url, payload, { headers });
		return { data: sortRawPostHogDataIntoColumns(response.data), errorred: false };
	} catch (err) {
		return { data: [], errorred: true };
	}
}
async function processSingleEvent(event) {
	// Todo: process each record in csv one by one
}

// Process page views
const processPageView = (songData, distinctId, referrer, day, past7, location, country, city) => {
	songData.totalPageviews++;
	songData.dailyBreakdowns[day].views++;

	// View counts
	if (past7) songData.twentyEightDays.viewCount++;
	else {
		songData.sevenDays.viewCount++;
		songData.twentyEightDays.viewCount++;
	}

	// Unique visitors
	if (!songData.visitors[distinctId]) {
		songData.uniqueVisitors++;
		songData.visitors[distinctId] = 1;
		if (past7) songData.twentyEightDays.uniqueViewCount++;
		else {
			songData.sevenDays.uniqueViewCount++;
			songData.twentyEightDays.uniqueViewCount++;
		}
	}

	// Daily visitor tracking
	if (!songData.dailyBreakdowns[day].visitors[distinctId]) {
		songData.dailyBreakdowns[day].distinctViews++;
		songData.dailyBreakdowns[day].visitors[distinctId] = 1;
	}

	// Process referrer
	if (referrer) {
		songData.referrers[referrer] = (songData.referrers[referrer] || 0) + 1;
		songData.dailyBreakdowns[day].referer[referrer] = (songData.dailyBreakdowns[day].referer[referrer] || 0) + 1;
		updateCount(past7 ? songData.twentyEightDays.referrers : songData.sevenDays.referrers, referrer);
	}

	// Process locations
	['locations', 'countries', 'cities'].forEach(type => {
		const value = { locations: location, countries: country, cities: city }[type];
		if (!value) return;
		songData[type][value] = (songData[type][value] || 0) + 1;
		updateCount(past7 ? songData.twentyEightDays[type] : songData.sevenDays[type], value);
	});
};

// Process provider clicks
const processProviderClick = (songData, providerTapped, day, past7) => {
	songData.taps[providerTapped] = (songData.taps[providerTapped] || 0) + 1;
	songData.dailyBreakdowns[day].taps[providerTapped] = (songData.dailyBreakdowns[day].taps[providerTapped] || 0) + 1;
	updateCount(past7 ? songData.twentyEightDays.taps : songData.sevenDays.taps, providerTapped);
};

// Finalize processing (log & return)
const finalizeProcessing = async (groupedData, shouldLog) => {
	if (Object.keys(groupedData).length > 0) {
		await updateInsights(groupedData);

		if (shouldLog) {
			const timestamp = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(/,/g, '').replace(/\//g, '-');
			const filePath = path.join(__dirname, '../logs/', `${timestamp}.json`);
			fs.writeFileSync(filePath, JSON.stringify(groupedData, null, 2), 'utf-8');
		}
		return groupedData;
	} else {
		console.log('No data processed');
		return 'none';
	}
};

const BatchProcessData = async (events, shouldLog = true) => {
	const todayDate = new Date();
	const groupedData = {};

	// Helper function to initialize song tracking object
	const initSongData = songId => ({
		sevenDays: createTimePeriodData(),
		twentyEightDays: createTimePeriodData(),
		totalPageviews: 0,
		uniqueVisitors: 0,
		totalPresaves: 0,
		taps: {},
		referrers: {},
		locations: {},
		visitors: {},
		cities: {},
		countries: {},
		dailyBreakdowns: {},
	});

	// Helper function to create a time period object
	const createTimePeriodData = () => ({
		viewCount: 0,
		uniqueViewCount: 0,
		liveVisitors: 0,
		bounceRate: 0,
		avgSession: 0,
		taps: createCounterObject(),
		countries: createCounterObject(),
		cities: createCounterObject(),
		locations: createCounterObject(),
		referrers: createCounterObject(),
	});

	// Helper function for tracking counts
	const createCounterObject = () => ({ counts: {}, total: 0, max: 0 });

	// Helper function to update count-based fields
	const updateCount = (period, key) => {
		period.counts[key] = (period.counts[key] || 0) + 1;
		period.total++;
		if (period.counts[key] > period.max) period.max = period.counts[key];
	};

	// Helper function to check if event is older than 7 days
	const isPast7Days = eventDate => {
		if (date.isSameDay(eventDate, todayDate)) return false;
		return date.differenceInCalendarDays(todayDate, eventDate) > 6;
	};

	// Process each event
	events?.forEach(event => {
		const songId = event.properties?.fantumSmartLinkId;
		if (!songId) return;

		const eventDate = new Date(event.timestamp);
		const day = formatDateMMDD(event.timestamp);
		const distinctId = event.distinct_id;
		const city = event.properties?.$geoip_city_name || 'unknown city';
		const country = event.properties?.$geoip_country_name || 'unknown country';
		const location = `${city}, ${country}`;
		const referrer = event.properties?.$referrer;
		const providerTapped = event.properties?.fantumProviderTapped || 'unknown-provider';
		const past7 = isPast7Days(eventDate);

		if (!groupedData[songId]) groupedData[songId] = initSongData(songId);
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

		// Handle different event types
		if (event.event === 'PAGE-VIEW-V2') {
			processPageView(groupedData[songId], distinctId, referrer, day, past7, location, country, city);
		} else if (event.event === 'PROVIDER-CLICK-V2') {
			processProviderClick(groupedData[songId], providerTapped, day, past7);
		}
	});

	// Save logs and return data
	return await finalizeProcessing(groupedData, shouldLog);
};

module.exports = {
	BatchGetEventsWith1MINInterval,
	processSingleEvent,
	BatchProcessData,
	BatchGetEvents,
};
