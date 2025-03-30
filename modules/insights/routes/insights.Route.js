const express = require('express');
const { getAllInsights, uploadFromCSV, getLinkInsights } = require('../controllers/insights.Controller');
const { initInsightsQueue } = require('../../../services/insightsQueue');
const getTopViewedInsight = require('../../../utils/firebase/highestViews');
const { migrateInsights } = require('../../../utils/pushLocal');
const { cacheInstance } = require('../../../utils/batch-single/cache');

initInsightsQueue();
const router = express.Router();

// Example route
router.post('/', getAllInsights);
router.get('/top', async (req, res) => {
	const r = await getTopViewedInsight();
	return res.json(r);
});
router.get('/link-insights', getLinkInsights);
router.patch('/upload-from-csv', uploadFromCSV);
router.patch('/migrate', migrateInsights);
router.get('/read', async (req, res) => {
	try {
		const JsonData = await cacheInstance.get();
		res.json(JsonData ?? {});
	} catch (e) {
		res.json({ err });
	}
});

// Add more routes as needed
router.get('/data', (req, res) => {
	res.send('Insights Data');
});

module.exports = router;
