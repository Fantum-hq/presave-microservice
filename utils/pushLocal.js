const fs = require('fs');
const path = require('path');
const { fireStore } = require('../config/firestore');
const { cacheInstance } = require('./batch-single/cache');

const FILE_PATH = path.join(__dirname, './batch-single/cache/log.json');
const BATCH_SIZE = 20; // Reduced batch size for safety
const DELAY_MS = 1000; // 1 second delay between batches
async function readExistingData() {
	try {
		const fileContent = await fs.promises.readFile(FILE_PATH, 'utf8');
		return JSON.parse(fileContent) || {};
	} catch (error) {
		if (error.code === 'ENOENT') {
			return {}; // Return empty object if file doesn't exist
		}
		console.error('Error reading data:', error);
		return {};
	}
}
async function migrateInsights(req, res) {
	try {
		const insights = await cacheInstance.get();
		console.log(Object.keys(insights).length);

		const docIds = Object.keys(insights);
		console.log({ docIds });

		if (docIds.length === 0) {
			console.log('No insights to migrate');
			res.status(200).json({ message: 'No insights to migrate' });
		}

		// Process in batches with delays
		for (let i = 0; i < docIds.length; i += BATCH_SIZE) {
			const batch = fireStore.batch();
			const batchIds = docIds.slice(i, i + BATCH_SIZE);

			await Promise.all(
				batchIds.map(async docId => {
					const docRef = fireStore.collection('insights').doc(docId);
					const processedData = insights[docId];
					console.log({ processedData });

					batch.set(docRef, insights[docId], { merge: false });
				})
			);

			await batch.commit();
			console.log(`Batch ${i / BATCH_SIZE + 1} committed successfully`);

			if (i + BATCH_SIZE < docIds.length) {
				await new Promise(resolve => setTimeout(resolve, DELAY_MS));
			}
		}

		console.log('Migration completed successfully');
		res.status(200).json({ message: 'Insights migrated successfully' });
	} catch (error) {
		console.error('Migration failed:', error);
		res.status(200).json({ message: 'Insights not migrated successfully' });
	}
}
async function migrateInsightsLive(insights) {
	try {
		console.log(Object.keys(insights).length);

		const docIds = Object.keys(insights);
		console.log({ docIds });

		if (docIds.length === 0) {
			console.log('No insights to migrate');
			res.status(200).json({ message: 'No insights to migrate' });
		}

		// Process in batches with delays
		for (let i = 0; i < docIds.length; i += BATCH_SIZE) {
			const batch = fireStore.batch();
			const batchIds = docIds.slice(i, i + BATCH_SIZE);

			await Promise.all(
				batchIds.map(async docId => {
					const docRef = fireStore.collection('insights').doc(docId);
					const processedData = insights[docId];

					batch.set(docRef, processedData, { merge: false });
				})
			);

			await batch.commit();
			console.log(`Batch ${i / BATCH_SIZE + 1} committed successfully`);

			if (i + BATCH_SIZE < docIds.length) {
				await new Promise(resolve => setTimeout(resolve, DELAY_MS));
			}
		}

		console.log('Migration completed successfully');
		return { message: 'Insights migrated successfully' };
	} catch (error) {
		console.error('Migration failed:', error);
		return { message: 'Insights not migrated successfully' };
	}
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

module.exports = { migrateInsights, migrateInsightsLive };
