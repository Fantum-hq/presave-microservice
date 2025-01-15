const { validationResult } = require('express-validator');
const { fireStore } = require('../../../config/firestore');
const { scheduleTask } = require('../../../services/scheduleTask');
const moment = require('moment');

const handlePresave = async (req, res) => {
	const { presaveID, accessToken, libraryId = 'my-library' } = req.body;

	try {
		// Fetch presave data from Firestore
		const presaveRef = fireStore
			.collection('smart-links')
			.doc(presaveID);
		const presaveDoc = await presaveRef.get();

		if (!presaveDoc.exists) {
			return res
				.status(404)
				.json({ error: 'Presave not found' });
		}

		const presaveData = presaveDoc.data();
		const { songLink, releaseDate, timeZone } = presaveData;

		// Query users collection to find the user by accessToken if not passed
		const usersRef = fireStore.collection('fans');
		const querySnapshot = await usersRef
			.where('spotify.accessToken', '==', accessToken)
			.get();

		if (querySnapshot.empty) {
			return res.status(404).json({
				error: 'User not found for the provided access token.',
			});
		}

		// Assuming there is only one document that matches the accessToken
		const userDoc = querySnapshot.docs[0];
		const userId = userDoc.id;

		// Convert release date to the user's time zone
		const releaseTime = new Date(releaseDate);
		const userReleaseTime = moment
			.tz(releaseTime, timeZone)
			.toDate();
		console.log('User release time:', timeZone, userReleaseTime);
		// Schedule the task
		scheduleTask({
			type: 'library',
			data: {
				userReleaseTime,
				userId,
				songLink,
				accessToken,
				timeZone,
				libraryId,
			},
		});

		return res
			.status(200)
			.json({ message: 'Song scheduling successful.' });
	} catch (error) {
		console.error('Error handling presave:', error);
		return res
			.status(500)
			.json({ error: 'Internal server error', error });
	}
};

module.exports = { handlePresave };
