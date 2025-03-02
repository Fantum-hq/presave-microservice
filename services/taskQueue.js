const Queue = require('bull');
const moment = require('moment-timezone');
const { addToLibrary } = require('../modules/spotify/services/spotify.Service');
const {
	convertToRelease,
} = require('../modules/presave/services/presave.Service');
const { QUEUES } = require('../config/queues');

// const { createClient } = require('redis');
// const pubClient = createClient({ url: 'redis://redis:6379' });
// Create a new queue (ensure it's using Bull v4.x)
const taskQueue = new Queue('taskQueue', QUEUES.taskQueue);

// Error handling for the queue
taskQueue.on('error', error => {
	console.error('task', 'Bull queue error:', error);
});

taskQueue.on('failed', (job, error) => {
	console.error(`Job ${job.id} failed:`, error);
});

// Process the jobs from the queue
taskQueue.process(async job => {
	const { userId, scanSource, accessToken, libraryId } = job.data;

	try {
		const success = await addToLibrary(
			accessToken,
			scanSource,
			libraryId
		);
		if (success) {
			console.log(
				`Successfully added song ${scanSource} to user ${userId}'s library`
			);
		} else {
			console.error(
				`Failed to add song ${scanSource} to user ${userId}'s library.`
			);
		}
	} catch (error) {
		console.error(
			`Error adding song for user ${userId}:`,
			error.message
		);
	}
});

module.exports = { taskQueue };
