const Queue = require('bull');
const Redis = require('ioredis');
const {
	getFantumInsights,
} = require('../modules/insights/services/insights.Service');
const { QUEUES } = require('../config/queues');

// Create a new Redis connection
const redis = new Redis();

// Create a new Bull queue
const insightsQueue = new Queue('insights', QUEUES.insightsQueue);

// Add a job to the queue to run every 10 minutes
async function initInsights() {
	const isReady = await insightsQueue.isReady();
	if (isReady) {
		console.log('insightsQueue is ready');

		await insightsQueue.empty(); // Clear any residual tasks
		insightsQueue.add({}, { repeat: { cron: '*/10 * * * *' } });
	}
}

// Process the jobs in the queue
insightsQueue.process(async job => {
	await getFantumInsights();
});

// Countdown logic
let countdown = 600; // 10 minutes in seconds
setInterval(() => {
	if (countdown > 0) {
		countdown--;
		countdown % 10 == 0 &&
			console.log(
				`Next job in ${Math.floor(countdown / 60)}m ${
					countdown % 60
				}s`
			);
	} else {
		countdown = 600; // Reset countdown after 10 minutes
	}
}, 1000);

console.log('Insights service is running...');
module.exports = { initInsights };
