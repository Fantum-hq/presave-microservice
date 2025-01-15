const axios = require('axios');
const { fireStore } = require('../../../config/firestore');
const { body } = require('express-validator');

function formattedData(data) {
	const providers = Object.keys(data.linksByPlatform).map(key => ({
		[key]: [data.linksByPlatform[key].url][0],
	}));
	return {
		providers: providers,
	};
}

const getOdesiData = async link => {
	const linkRegex = /^(http|https):\/\/[^ "]+$/;
	if (!linkRegex.test(link)) {
		return Response.json({ data: { code: 'Invalid URL format' } });
	}
	try {
		const result = await axios.get(
			`https://api.song.link/v1-alpha.1/links?url=${link}`
		);
		const data = result.data;
		return formattedData(data);
	} catch (err) {
		throw new Error('Failed to fetch Odesi data');
	}
};

const convertToRelease = async data => {
	try {
		console.log('createRelease Function::', { data });

		const {
			id,
			creatorId,
			scanSource,
			releaseType,
			timeZone,
			showReleaseDate,
			releaseDate,
			title,
			artist,
			image,
		} = data;

		// Query the "presaves" collection to check for its existence
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

		const odesiResponse = await getOdesiData(scanSource);
		console.log({ odesiResponse });

		// Create a new presave document
		const newReleaseData = {
			id,
			creatorId,
			scanSource,
			releaseType,
			timeZone,
			showReleaseDate,
			releaseDate,
			title,
			artist,
			image,
			type: 'released',
			...odesiResponse,
		};

		const newPresaveRef = await fireStore
			.collection('smart-links')
			.doc(newReleaseData.id)
			.set(newReleaseData);
		console.log('Success', odesiResponse);
		return {
			success: true,
			message: 'Song added to your library successfully!',
			data: { odesiResponse, id: newPresaveRef.id },
		};
	} catch (error) {
		return {
			success: false,
			message: 'error',
			data: error,
		};
	}
};

module.exports = { convertToRelease };
