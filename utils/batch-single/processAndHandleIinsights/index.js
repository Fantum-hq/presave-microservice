const date = require('date-fns');
const { formatDateMMDD } = require('../formatDate');

module.exports.processAndHandleIinsights = function (event) {
	const groupedData = {};
	const eventTypes = ['PAGE-VIEW-V2', 'PROVIDER-ClICK-V2', 'PROVIDER-CLICK-V2'];

	if (!eventTypes.includes(event.event)) return;

	const eventType = event.event;
	const todayDate = new Date();
	const songId = event.properties.fantumSmartLinkId;
	const eventDate = new Date(event.timestamp);
	const distinctId = event.distinct_id;
	const day = formatDateMMDD(event.timestamp);
	const city = event.properties?.$geoip_city_name || 'unknown city';
	const country = event.properties?.$geoip_country_name || 'unknown country';
	const location = `${city}, ${country}`;
	const referrer = event.properties?.$referrer;

	if (!songId) return;

	let isTwentyEightDays = false;
	if (!date.isSameDay(eventDate, todayDate)) {
		const diffDays = date.differenceInCalendarDays(todayDate, eventDate);
		isTwentyEightDays = diffDays > 6;
	}

	if (!groupedData[songId]) {
		groupedData[songId] = {
			id: songId,
			sevenDays: createPeriodObject(),
			twentyEightDays: createPeriodObject(),
			totalPageviews: 0,
			uniqueVisitors: 0,
			totalPresaves: 0,
			taps: { counts: {}, total: 0, max: 0 },
			referrers: {},
			locations: {},
			visitors: {},
			cities: {},
			countries: {},
			dailyBreakdowns: {},
		};
	}

	if (!groupedData[songId].dailyBreakdowns[day]) {
		groupedData[songId].dailyBreakdowns[day] = createDailyBreakdown();
	}

	if (eventType === 'PAGE-VIEW-V2') {
		groupedData[songId].totalPageviews++;
		groupedData[songId].dailyBreakdowns[day].views++;

		updatePeriod(groupedData[songId], isTwentyEightDays, 'views');

		if (!groupedData[songId].visitors[distinctId]) {
			groupedData[songId].uniqueVisitors++;
			groupedData[songId].visitors[distinctId] = 1;
			updatePeriod(groupedData[songId], isTwentyEightDays, 'uniqueVisitors', distinctId);
		}

		if (!groupedData[songId].dailyBreakdowns[day].visitors[distinctId]) {
			groupedData[songId].dailyBreakdowns[day].visitors[distinctId] = 1;
			groupedData[songId].dailyBreakdowns[day].uniqueVisitors = Object.keys(groupedData[songId].dailyBreakdowns[day].visitors).length;
		}

		processDailyMetric(groupedData[songId].dailyBreakdowns[day], referrer, 'referrers');
		processDailyMetric(groupedData[songId].dailyBreakdowns[day], city, 'cities');
		processDailyMetric(groupedData[songId].dailyBreakdowns[day], country, 'countries');
	}

	if (eventType === 'PROVIDER-CLICK-V2' || eventType === 'PROVIDER-ClICK-V2') {
		const providerTapped = event.properties?.fantumProviderTapped || 'unknown-provider';
		processDailyMetric(groupedData[songId].dailyBreakdowns[day], providerTapped, 'taps');
	}

	return groupedData[songId];
};

function createPeriodObject() {
	return {
		views: 0,
		uniqueVisitors: 0,
		liveVisitors: 0,
		bounceRate: 0,
		avgSession: 0,
		visitors: {},
		taps: { counts: {}, total: 0, max: 0 },
		countries: { counts: {}, total: 0, max: 0 },
		cities: { counts: {}, total: 0, max: 0 },
		locations: { counts: {}, total: 0, max: 0 },
		referrers: { counts: {}, total: 0, max: 0 },
	};
}

function createDailyBreakdown() {
	return {
		views: 0,
		taps: {},
		cities: {},
		countries: {},
		visitors: {},
		referrers: {},
		totalTaps: 0,
		totalCities: 0,
		totalReferrer: 0,
		uniqueVisitors: 0,
		totalCountries: 0,
	};
}

function updatePeriod(data, isTwentyEightDays, key, id) {
	if (isTwentyEightDays) {
		data.twentyEightDays[key]++;
		if (id) data.twentyEightDays.visitors[id] = 1;
	} else {
		data.sevenDays[key]++;
		data.twentyEightDays[key]++;
		if (id) {
			data.sevenDays.visitors[id] = 1;
			data.twentyEightDays.visitors[id] = 1;
		}
	}
}

function processDailyMetric(dailyData, value, type) {
	if (!value) return;
	dailyData[type][value] = (dailyData[type][value] || 0) + 1;

	const totalKey = `total${capitalizeFirstLetter(type)}`;
	dailyData[totalKey] = (dailyData[totalKey] || 0) + 1;
}

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}
