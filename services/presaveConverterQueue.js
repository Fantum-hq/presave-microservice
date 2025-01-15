const Bull = require('bull');
const moment = require('moment-timezone');
const {
	convertToRelease,
} = require('../modules/presave/services/presave.Service');

// Create a new queue (ensure it's using Bull v4.x)
const presaveConverterQueue = new Bull('presaveConverterQueue', {
	redis: {
		host: 'localhost',
		port: 6379,
	},
});

// Error handling for the queue
presaveConverterQueue.on('error', error => {
	console.error('Bull queue error:', error);
});

presaveConverterQueue.on('failed', (job, error) => {
	console.error(`Job ${job.id} failed:`, error);
});

// Process the jobs from the queue
presaveConverterQueue.process(async job => {
	console.log(job.data);

	try {
		const {
			id,
			creatorId,
			scanSource,
			releaseType,
			timeZone,
			showReleaseDate,
			releaseDate,
			providers,
			title,
			artist,
			type,
			image,
		} = job.data;

		console.log('trying,  job.data.presave: ', job.data);

		const success = await convertToRelease({
			id,
			creatorId,
			scanSource,
			releaseType,
			timeZone,
			showReleaseDate,
			releaseDate,
			providers,
			title,
			artist,
			type,
			image,
		});
		if (success) {
			console.log(`Successfully converted to release`);
		} else {
			console.error(`Failed to convert`);
		}
	} catch (error) {
		console.error(`Error :`, error);
	}
});

module.exports = { presaveConverterQueue };
