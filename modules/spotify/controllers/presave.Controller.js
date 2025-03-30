const { validationResult } = require('express-validator');
const { fireStore, firebase } = require('../../../config/firestore');
const { scheduleTask } = require('../../../services/scheduleTask');
const moment = require('moment');

const handlePresave = async (req, res) => {
	console.log(req.body);

	const { timeZone: ftz = undefined, presaveID, accessToken, libraryId = 'my-library' } = req.body;

	try {
		// Fetch presave data from Firestore
		const presaveRef = fireStore.collection('smart-links').doc(presaveID);
		const presaveDoc = await presaveRef.get();

		if (!presaveDoc.exists) {
			return res.status(404).json({ error: 'Presave not found' });
		}

		const presaveData = presaveDoc.data();

		// Query users collection to find the user by accessToken if not passed
		const usersRef = fireStore.collection('fans');
		const querySnapshot = await usersRef.where('spotify.accessToken', '==', accessToken).get();

		if (querySnapshot.empty) {
			return res.status(404).json({
				error: 'User not found for the provided access token.',
			});
		}

		// Assuming there is only one document that matches the accessToken
		const userDoc = querySnapshot.docs[0];
		const userId = userDoc.id;

		const { releaseDate, scanSource, timeZone, releaseType } = presaveData;

		console.log({ scanSource, releaseDate, releaseType, timeZone });

		// Schedule the task
		scheduleTask({
			type: 'library',
			data: {
				userId,
				libraryId,
				scanSource,
				releaseDate,
				accessToken,
				releaseType,
				FanTimeZone: ftz,
				CreatorsTimeZone: timeZone,
			},
		});

		await fireStore
			.collection('fans')
			.doc(userId)
			.update({
				presaves: firebase.firestore.FieldValue.arrayUnion(presaveID),
			});

		return res.status(200).json({ message: 'Song scheduling successful.' });
	} catch (error) {
		console.error('Error handling presave:', error);
		return res.status(500).json({ error: 'Internal server error', error });
	}
};

module.exports = { handlePresave };
