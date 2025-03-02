const { fireStore } = require('../../config/firestore');

async function updateInsights(insights) {
	if (Object.keys(insights).length == 0) {
		console.log('no Insight data to update');
		return null;
	}

	const batch = fireStore.batch();
	for (const id of Object.keys(insights)) {
		console.log(id);
		const insight = insights[id];
		const insightRef = fireStore.collection('insights').doc(id);

		// Pull existing data
		const doc = await insightRef.get();
		if (doc.exists) {
			const existingData = doc.data();
			// Merge existing data with new data, adding numbers for properties that exist in both
			const updatedData = mergeData(existingData, insight);
			batch.set(insightRef, updatedData, { merge: true });
		} else {
			batch.set(insightRef, insight, { merge: true });
		}
	}

	try {
		await batch.commit();
		console.log('Insights updated successfully');
		return { success: true };
	} catch (error) {
		console.log('Error updating insights: ', error);
		return { success: false, error };
	}
}

function mergeData(existingData, newData) {
	const mergedData = { ...existingData };
	for (const key in newData) {
		if (
			typeof newData[key] === 'object' &&
			!Array.isArray(newData[key])
		) {
			mergedData[key] = mergeData(
				existingData[key] || {},
				newData[key]
			);
		} else if (
			typeof newData[key] === 'number' &&
			typeof existingData[key] === 'number'
		) {
			mergedData[key] = existingData[key] + newData[key];
		} else {
			mergedData[key] = newData[key];
		}
	}
	return mergedData;
}

async function createCollectionIfNotExists(collectionName) {
	const collectionRef = fireStore.collection(collectionName);
	const snapshot = await collectionRef.limit(1).get();
	if (snapshot.empty) {
		await collectionRef.add({ initialized: true });
		console.log(`Collection ${collectionName} created.`);
	} else {
		console.log(`Collection ${collectionName} already exists.`);
	}
}

module.exports = updateInsights;
