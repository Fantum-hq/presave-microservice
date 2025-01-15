const { taskQueue } = require('./taskQueue');
const {
	convertToRelease,
} = require('../modules/presave/services/presave.Service');

// Function to start the worker
const startWorker = () => {
	taskQueue.process(async job => {
		if (job.data.presave) {
			console.log(
				'trying,  job.data.presave: ',
				job.data.presave
			);

			const convertSucces = await convertToRelease(
				job.data.presave
			);
			console.log({ convertSucces });
			return;
		}
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

	console.log('Worker started and listening for jobs...');
};

// Start the worker process
startWorker();
