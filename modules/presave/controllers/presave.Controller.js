const { validationResult } = require('express-validator');
const { fireStore } = require('../../../config/firestore');
const { scheduleTask } = require('../../../services/scheduleTask');
const moment = require('moment-timezone');
const uuid = require('uuid');

const presaveFields = ['creatorId', 'scanSource', 'releaseType', 'timeZone', 'showReleaseDate', 'releaseDate', 'providers', 'title', 'artist', 'type', 'image']
const storePresaveDetails = async (req, res) => {
	try {
		
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const presaveData = req.body;
		if( !presaveFields
			.every(key => Object.keys(presaveData).includes(key))  ){
			const failedFields = presaveFields.filter(field => !presaveData[field]);
			return res.status(400).json({
				error: 'Missing required fields',
				missingFields: failedFields
			});
		}
		const presavesSnapshot = await fireStore
		.collection('smart-links')
		.limit(1)
		.get();


		if (presavesSnapshot.empty) {
			console.log(
				"No 'smart-links' collection found. Creating a new one..."
			);
		}


		const newPresaveData = {
			id: uuid.v4(),
			createdAt: new Date().toISOString(),
			...presaveData,
		};

		scheduleTask({
			type: 'presave',
			data: { ...newPresaveData, CreatorsTimeZone: timeZone },
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
