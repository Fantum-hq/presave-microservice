const { default: axios } = require('axios');
const fs = require('fs');
const path = require('path');
const updateInsights = require('./firebase/updateInsights');

function formatDate(dateString) {
	const date = new Date(dateString);
	return date
		.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
		.replace(',', '');
}
async function BatchGetEvents10() {
	const url = 'https://us.posthog.com/api/projects/87171/query/';
	const headers = {
		'Content-Type': 'application/json',
		Authorization:
			'Bearer phx_rVcI762CYMVQkrGYqxGQ20OIcBqFPAR8pSVwV2E8WXncU7w',
	};
	const payload = {
		query: {
			kind: 'HogQLQuery',
			query: `
                SELECT 
                    uuid,
                    event,
                    properties.$pathname AS pathname,
                    properties AS properties,
                    properties.$host AS host,
                    properties.providerTapped AS provider_tapped,
                    properties.$referrer AS referrer,
                    properties.$geoip_city_name AS city,
                    properties.$geoip_country_name AS country,
                    properties.$current_url AS current_url,
                    timestamp
                FROM 
                    events
                WHERE
                    event IN ('PROVIDER-ClICK-V2', 'PAGE-VIEW-V2')
                    AND timestamp >= NOW() - INTERVAL 10 MINUTE
                ORDER BY 
                    timestamp DESC
                
            `,
		},
	};
	try {
		const response = await axios.post(url, payload, { headers });

		const data = response.data;

		const res = data.results.reduce((acc, row) => {
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
		return res;
	} catch (err) {
		console.log(err);
		return null;
	}
}
const BatchProcessData = async events => {
	const groupedData = {};
	events?.forEach((event, i) => {
		const songId = event.properties?.fantumSmartLinkId;
		const eventDate = formatDate(event.timestamp);
		const providerTapped = event.properties?.fantumProviderTapped;
		const referrer = event.properties?.$referrer;
		const city =
			event.properties?.$geoip_city_name || 'unknown city';
		const country =
			event.properties?.$geoip_country_name ||
			'unknown country';
		const location = `${city}, ${country}`;

		if (!songId)
			return {
				views: {},
				taps: {},
				referer: {},
				locations: {},
			};
		if (!groupedData[songId]) {
			groupedData[songId] = {
				views: {},
				taps: {},
				referer: {},
				locations: {},
			};
		}
		if (event.event === 'PAGE-VIEW-V2') {
			groupedData[songId].views[eventDate] =
				(groupedData[songId].views[eventDate] || 0) + 1;
		}
		if (providerTapped) {
			groupedData[songId].taps[providerTapped] =
				(groupedData[songId].taps[providerTapped] ||
					0) + 1;
		}
		if (referrer) {
			groupedData[songId].referer[referrer] =
				(groupedData[songId].referer[referrer] || 0) +
				1;
		}
		groupedData[songId].locations[location] =
			(groupedData[songId].locations[location] || 0) + 1;
	});
	await updateInsights(groupedData);
	const timestamp = new Date()
		.toLocaleString('en-GB', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: true,
		})
		.replace(/,/, '')
		.replace(/\//g, '-');
	const filePath = path.join(__dirname, '../logs/', `${timestamp}.json`);
	if (Object.keys(groupedData).length != 0) {
		fs.writeFileSync(
			filePath,
			JSON.stringify(groupedData, null, 2),
			'utf-8'
		);
	}
	return groupedData;
};
async function getEvents(userName) {
	const url = 'https://us.posthog.com/api/projects/87171/query/';
	const headers = {
		'Content-Type': 'application/json',
		Authorization:
			'Bearer phx_rVcI762CYMVQkrGYqxGQ20OIcBqFPAR8pSVwV2E8WXncU7w',
	};
	const payload = {
		query: {
			kind: 'HogQLQuery',
			query: `
                SELECT 
                    uuid,
                    event,
                    properties.$pathname AS pathname,
                    properties AS properties,
                    properties.$host AS host,
                    properties.providerTapped AS provider_tapped,
                    properties.$referrer AS referrer,
                    properties.$geoip_city_name AS city,
                    properties.$geoip_country_name AS country,
                    properties.$current_url AS current_url,
                    timestamp
                FROM 
                    events
                WHERE 
                    event IN ('$pageview', 'FANTUM-INSIGHTS')
                    AND (properties.$host = '${userName}.fantum.me' OR properties.$host = '${userName}.ftu.me')
                    AND timestamp >= '2024-01-29'
                ORDER BY 
                    timestamp ASC
            `,
		},
	};
	try {
		const response = await fetch(url, {
			method: 'POST',
			body: JSON.stringify(payload),
			headers,
		});

		const data = await response.json();

		const res = data.results.reduce((acc, row) => {
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
		return res;
	} catch (err) {
		console.log(err);
		return null;
	}
}
async function getEventsV2(userId) {
	const url = 'https://us.posthog.com/api/projects/87171/query/';
	const headers = {
		'Content-Type': 'application/json',
		Authorization:
			'Bearer phx_rVcI762CYMVQkrGYqxGQ20OIcBqFPAR8pSVwV2E8WXncU7w',
	};
	const payload = {
		query: {
			kind: 'HogQLQuery',
			query: `
                SELECT 
                    uuid,
                    event,
                    properties.$pathname AS pathname,
                    properties AS properties,
                    properties.$host AS host,
                    properties.providerTapped AS provider_tapped,
                    properties.$referrer AS referrer,
                    properties.$geoip_city_name AS city,
                    properties.$geoip_country_name AS country,
                    properties.$current_url AS current_url,
                    timestamp
                FROM 
                    events
                WHERE
                    event IN ('PROVIDER-ClICK-V2', 'PAGE-VIEW-V2')
                    AND properties.fantumCreatorId = '${userId}'
                    AND timestamp >= NOW() - INTERVAL 6 DAY
                ORDER BY 
                    timestamp DESC
            `,
		},
	};
	try {
		const response = await fetch(url, {
			method: 'POST',
			body: JSON.stringify(payload),
			headers,
		});
		const _eval = r =>
			r.reduce((acc, row) => {
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

		const data = await response.json();

		const _iterate = async next => {
			if (next) {
				const n = await fetch(next);
				const d = await response.json();
				data.results = [...data.results, ...d.results];
				d.next && _iterate(d.next);
				data.next = d.next;
			}
		};
		data.next && _iterate(data.next);
		const { results } = data;

		const res = _eval(results);

		return res;
	} catch (err) {
		console.log(err);
		return null;
	}
}

const processData = events => {
	const extractSongId = pathname => pathname?.split('/').pop() || null;
	const extractUserName = host => host.split('.')[0];
	const groupedData = {};
	events?.forEach((event, i) => {
		const userName = extractUserName(event.properties?.$host);
		const songId = extractSongId(event.properties?.$pathname);
		const eventDate = formatDate(event.timestamp);
		const providerTapped = event.properties?.providerTapped;
		const referrer = event.properties?.$referrer;
		const city =
			event.properties?.$geoip_city_name || 'unknown city';
		const country =
			event.properties?.$geoip_country_name ||
			'unknown country';
		const location = `${city}, ${country}`;

		if (!songId)
			return {
				views: {},
				taps: {},
				referer: {},
				locations: {},
			};
		if (!groupedData[userName + '::' + songId]) {
			groupedData[userName + '::' + songId] = {
				views: {},
				taps: {},
				referer: {},
				locations: {},
			};
		}
		if (event.event === '$pageview') {
			groupedData[userName + '::' + songId].views[eventDate] =
				(groupedData[userName + '::' + songId].views[
					eventDate
				] || 0) + 1;
		}
		if (providerTapped) {
			groupedData[userName + '::' + songId].taps[
				providerTapped
			] =
				(groupedData[userName + '::' + songId].taps[
					providerTapped
				] || 0) + 1;
		}
		if (referrer) {
			groupedData[userName + '::' + songId].referer[
				referrer
			] =
				(groupedData[userName + '::' + songId].referer[
					referrer
				] || 0) + 1;
		}
		groupedData[userName + '::' + songId].locations[location] =
			(groupedData[userName + '::' + songId].locations[
				location
			] || 0) + 1;
	});
	return groupedData;
};
const processDataV2 = events => {
	const extractSongId = pathname => pathname?.split('/').pop() || null;
	const extractUserName = host => host.split('.')[0];
	const groupedData = {};
	events?.forEach((event, i) => {
		const songId = event.properties?.fantumSmartLinkId;
		const eventDate = formatDate(event.timestamp);
		const providerTapped = event.properties?.fantumProviderTapped;
		const referrer = event.properties?.$referrer;
		const city =
			event.properties?.$geoip_city_name || 'unknown city';
		const country =
			event.properties?.$geoip_country_name ||
			'unknown country';
		const location = `${city}, ${country}`;

		if (!songId)
			return {
				views: {},
				taps: {},
				referer: {},
				locations: {},
			};
		if (!groupedData[songId]) {
			groupedData[songId] = {
				views: {},
				taps: {},
				referer: {},
				locations: {},
			};
		}
		if (event.event === 'PAGE-VIEW-V2') {
			groupedData[songId].views[eventDate] =
				(groupedData[songId].views[eventDate] || 0) + 1;
		}
		if (providerTapped) {
			groupedData[songId].taps[providerTapped] =
				(groupedData[songId].taps[providerTapped] ||
					0) + 1;
		}
		if (referrer) {
			groupedData[songId].referer[referrer] =
				(groupedData[songId].referer[referrer] || 0) +
				1;
		}
		groupedData[songId].locations[location] =
			(groupedData[songId].locations[location] || 0) + 1;
	});
	return groupedData;
};
const getInsights = async ({ userName, userId }) => {
	const v1 = await getEvents(userName);
	const v2 = await getEventsV2(userId);
	const pr = processData(v1);
	const pr2 = processDataV2(v2);

	const mergedData = { ...pr2 };
	for (const key in pr2) {
		if (mergedData[key]) {
			mergedData[key].views = {
				...mergedData[key].views,
				...pr2[key].views,
			};
			mergedData[key].taps = {
				...mergedData[key].taps,
				...pr2[key].taps,
			};
			mergedData[key].referer = {
				...mergedData[key].referer,
				...pr2[key].referer,
			};
			mergedData[key].locations = {
				...mergedData[key].locations,
				...pr2[key].locations,
			};
		} else {
			mergedData[key] = pr2[key];
		}
	}
	return mergedData;
};
const getViewsByDates = (groupedData, songId) => {
	if (!groupedData[songId]) {
		return `No data found for songId: ${songId}`;
	}
	return groupedData[songId].views || {};
};
const getTapsByProvider = (groupedData, songId) => {
	if (!groupedData[songId]) {
		return `No data found for songId: ${songId}`;
	}
	return groupedData[songId].taps || {};
};
const getReferers = (groupedData, songId) => {
	if (!groupedData[songId]) {
		return `No data found for songId: ${songId}`;
	}
	return groupedData[songId].referer || {};
};
const getTotalTaps = (groupedData, songId) => {
	if (!groupedData[songId]) {
		return -1;
	}
	return Object.values(groupedData[songId].taps).reduce(
		(acc, num) => acc + num,
		0
	);
};

module.exports = {
	BatchProcessData,
	BatchGetEvents10,
	getInsights,
	getViewsByDates,
	getTapsByProvider,
	getReferers,
	getTotalTaps,
};
