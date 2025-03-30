const { fireStore } = require('../../../config/firestore');
const { cacheInstance } = require('../../../utils/batch-single/cache');
const { InsightProcessor } = require('../../../utils/batch-single/insightsProcessor');
const { BatchGetEvents } = require('../../../utils/insights');
const path = require('path');
const { migrateInsights } = require('../../../utils/pushLocal');

// Singleton processor instance
const processor = new InsightProcessor(cacheInstance);
let lastProcessedTime = Date.now();
const getFantumInsights = async () => {
	try {
		const now = Date.now();
		const insights = await BatchGetEvents(`BETWEEN ${lastProcessedTime} AND ${now + 30000}`);
		lastProcessedTime = now;
		for (const insight of insights) {
			const processed = await processor.processEvent(insight);
			if (!processed?.id) {
				console.log('weird');
			}
		}

		if (insights && Object.keys(insights).length > 0) {
			const JsonData = await cacheInstance.get();

			await migrateInsights();

			return JsonData;
		} else {
			return {};
		}
	} catch (error) {
		console.error('Error:', error.message);
		return { error: error.message };
	}
};

async function getInsightByLinkId(id) {
	const _insight = await fireStore.doc(`insights/${id}`).get();
	const insight = _insight.data();
	return insight;
}

module.exports = { getFantumInsights, getInsightByLinkId };
