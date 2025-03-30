const Queue = require('bull');
const Redis = require('ioredis');
const { getFantumInsights } = require('../modules/insights/services/insights.Service');
const { QUEUES } = require('../config/queues');
const { sync } = require('../modules/insights/controllers/insights.Controller');

// Create a new Bull queue
const insightsQueue = new Queue('insights', QUEUES.insightsQueue);

// Add a job to the queue to run every 30 seconds with retry logic
async function initInsightsQueue() {
	const isReady = await insightsQueue.isReady();
	if (isReady) {
		await insightsQueue.empty(); // Clear any residual tasks
		insightsQueue.add(
			{},
			{
				repeat: { every: 60000 }, //30000 }, // Runs every 30 seconds
				attempts: 1, // Retry up to 3 times
				backoff: 0, // Wait 5 seconds between retries
			}
		);
	}
}

// Process the jobs in the queue
insightsQueue.process(1, async job => {
	try {
		await sync();
	} catch (error) {
		console.error(`Error processing job ${job.id}:`, error);
		throw error;
	}
});
insightsQueue.on('SIGTERM', async () => {
	await insightsQueue.close();
	// processor.cleanup();
});

// Listen for failed jobs
insightsQueue.on('failed', async (job, error) => {
	if (job.attemptsMade >= job.opts.attempts) {
		await insightsQueue.add('dead-letter', job.data);
	}
});
module.exports = { initInsightsQueue, insightsQueue };
