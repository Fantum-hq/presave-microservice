const express = require('express');
const {
	getAllInsights,
	rebaseInsights,
} = require('../controllers/insights.Controller');
const {
	initInsights,
	getLinkInsights,
} = require('../../../services/insightsQueue');

initInsights();
const router = express.Router();

// Example route
router.get('/', getAllInsights);
// router.get('/link-insights', getLinkInsights);
router.patch('/rebase', rebaseInsights);

// Add more routes as needed
router.get('/data', (req, res) => {
	res.send('Insights Data');
});

module.exports = router;
