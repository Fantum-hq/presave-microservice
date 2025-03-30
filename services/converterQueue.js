const Queue = require('bull');
const { convertToRelease } = require('../modules/presave/services/presave.Service');
const { QUEUES } = require('../config/queues');

const converterQueue = new Queue('converterQueue', QUEUES.converterQueue);

converterQueue.on('error', error => {
	console.error('Bull queue error:', error);
});

converterQueue.on('failed', (job, error) => {
	console.error(`Job ${job.id} failed:`, error);
});

// Process the jobs from the queue
converterQueue.process(async job => {
	console.log(job.data);

	try {
		const { id, creatorId, scanSource, releaseType, timeZone, showReleaseDate, releaseDate, providers, title, artist, type, image } = job.data;

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

module.exports = { converterQueue };
