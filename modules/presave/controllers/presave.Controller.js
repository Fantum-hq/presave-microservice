const { validationResult } = require('express-validator');
const { fireStore } = require('../../../config/firestore');
const { scheduleTask } = require('../../../services/scheduleTask');
const moment = require('moment-timezone');
const uuid = require('uuid');

const generateRandomId = () => {
	const randomId = `creatorId-${Date.now()}${Math.floor(
		Math.random() * 10000000000000000
	)}`;
	return randomId;
};

const storePresaveDetails = async (req, res) => {
	try {
		// Validate request input
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const {
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
		} = req.body;

		console.log({ releaseDate });

		// Query the "smart-links" collection to check for its existence
		const presavesSnapshot = await fireStore
			.collection('smart-links')
			.limit(1)
			.get();

		// If the collection does not exist, presavesSnapshot.empty will be true
		if (presavesSnapshot.empty) {
			console.log(
				"No 'smart-links' collection found. Creating a new one..."
			);
		}

		// Convert release date to the user's time zone
		const releaseTime = new Date(releaseDate);
		const linksReleaseTime = moment
			.tz(releaseTime, timeZone)
			.toDate();

		// Create a new presave document
		// const newPresaveData = {
		// 	id: uuid(),
		// 	image,
		// 	type,
		// 	releaseType,
		// 	creatorId: creatorId || generateRandomId(), //replace withUser UUID
		// 	title,
		// 	artist,
		// 	releaseDate,
		// 	timeZone,
		// 	providers,
		// 	songLink,
		// 	createdAt: new Date().toISOString(), // Add a timestamp for tracking
		// 	scanSource,
		// };
		const newPresaveData = {
			id: uuid.v4(),
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
			linksReleaseTime,
			createdAt: new Date().toISOString(),
		};

		scheduleTask({
			type: 'presave',
			data: newPresaveData,
		});

		const newPresaveRef = await fireStore
			.collection('smart-links')
			.doc(newPresaveData.id)
			.create(newPresaveData);

		res.status(200).json({
			message: 'Presave created successfully',
			id: newPresaveRef.id,
			...newPresaveData,
		});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({ error: error.message });
	}
};

// Controller to handle fetching presaves by id or creatorId
const getPresaveDetails = async (req, res) => {
	try {
		const { id } = req.query;

		if (!id) {
			return res.status(400).json({
				error: "Either 'id' is required to fetch a presave.",
			});
		}

		let querySnapshot;
		if (id) {
			// Fetch presave by ID
			querySnapshot = await fireStore
				.collection('presaves')
				.doc(id)
				.get();
		}

		if (!querySnapshot.exists && querySnapshot.empty) {
			return res
				.status(404)
				.json({ error: 'Presave not found.' });
		}

		const presaveData = querySnapshot.data
			? querySnapshot.data()
			: querySnapshot.docs[0].data();

		res.status(200).json({
			message: 'Presave retrieved successfully',
			presave: { ...presaveData, id: querySnapshot.id },
		});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({ error: error.message });
	}
};

module.exports = { storePresaveDetails, getPresaveDetails };
