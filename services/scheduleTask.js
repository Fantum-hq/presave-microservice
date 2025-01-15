const moment = require('moment-timezone');
const { taskQueue } = require('./taskQueue');
const { presaveConverterQueue } = require('./presaveConverterQueue');

// Function to schedule a task for a user
const scheduleTask = async ({ type, data }) => {
	if (type == 'presave') {
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
			linksReleaseTime,
			image,
		} = data;

		// Convert the release date to the user's time zone and get the cron time format

		const releaseTime = moment(linksReleaseTime);

		// Calculate the delay (in milliseconds) until the user release time
		const delay = releaseTime.diff(moment());
		console.log({ linksReleaseTime, releaseTime, delay });

		// Add the job to the queue with a delay
		presaveConverterQueue.add(
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
			`Presave From Fantum User Task scheduled for link ${releaseTime.format()} (${timeZone}).`
		);
		return;
	}
	if (type == 'library') {
		const {
			userReleaseTime,
			userId,
			songLink,
			accessToken,
			timeZone,
			libraryId,
		} = data;
		// Convert the release date to the user's time zone and get the cron time format
		const userTime = moment.tz(userReleaseTime, timeZone);

		// Calculate the delay (in milliseconds) until the user release time
		const delay = userTime.diff(moment());

		// Add the job to the queue with a delay
		await taskQueue.add(
			{ userId, songLink, accessToken, libraryId },
			{ delay } // Delay the job execution to the user's release time
		);

		console.log(
			`Task scheduled for user ${userId} at ${userTime.format()} (${timeZone}).`
		);
	}
};

module.exports = { scheduleTask };
