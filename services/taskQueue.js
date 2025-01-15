const Bull = require('bull');
const moment = require('moment-timezone');
const { addToLibrary } = require('../modules/spotify/services/spotify.Service');
const {
	convertToRelease,
} = require('../modules/presave/services/presave.Service');

// Create a new queue (ensure it's using Bull v4.x)
const taskQueue = new Bull('taskQueue', {
	redis: {
		host: 'localhost',
		port: 6379,
	},
});

// Error handling for the queue
taskQueue.on('error', error => {
	console.error('Bull queue error:', error);
});

taskQueue.on('failed', (job, error) => {
	console.error(`Job ${job.id} failed:`, error);
});

// Process the jobs from the queue
taskQueue.process(async job => {
	const { userId, songLink, accessToken, libraryId } = job.data;

	try {
		const success = await addToLibrary(
			accessToken,
			songLink,
			libraryId
		);
		if (success) {
			console.log(
				`Successfully added song ${songLink} to user ${userId}'s library`
			);
		} else {
			console.error(
				`Failed to add song ${songLink} to user ${userId}'s library.`
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
