const moment = require('moment-timezone');
const { taskQueue } = require('./taskQueue');
const { converterQueue } = require('./converterQueue');
const { getDelay } = require('../utils/getDelay');

const taskTypes = ['presaveConversion', 'fanLibraryUpdate'];

// Function to schedule a task for a user
const scheduleTask = async ({ type, data }) => {
	if (type == 'presave') {
		const {
			id,
			creatorId,
			scanSource,
			releaseType,
			CreatorsTimeZone,
			timeZone,
			showReleaseDate,
			releaseDate,
			providers,
			title,
			artist,
			type,
			image,
		} = data;

		// Convert the release date to the user's time zone and get the cron time format

		const delay = getDelay({
			releaseDate,
			CreatorsTimeZone,
			timeZone,
			releaseType,
		});
		console.log({ releaseDate, CreatorsTimeZone, delay });

		// Add the job to the queue with a delay
		converterQueue.add(
			{
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
			},
			{ delay } // Delay the job execution to the user's release time
		);

		console.log(
			`Presave From Fantum User Task scheduled for link ${releaseDate} (${timeZone}).`
		);
		return;
	}
	if (type == 'library') {
		const {
			releaseDate,
			userId,
			scanSource,
			accessToken,
			CreatorsTimeZone,
			FanTimeZone = undefined,
			releaseType,
			libraryId,
		} = data;
		// Convert the release date to the user's time zone and get the cron time format

		const delay = getDelay({
			releaseDate,
			releaseType,
			CreatorsTimeZone,
			FanTimeZone,
		});

		// Add the job to the queue with a delay
		await taskQueue.add(
			{ userId, scanSource, accessToken, libraryId },
			{ delay } // Delay the job execution to the user's release time
		);

		console.log(
			`Task scheduled for user ${userId} at ${FanTimeZone} (${CreatorsTimeZone}).`
		);
	}
};

module.exports = { scheduleTask };
