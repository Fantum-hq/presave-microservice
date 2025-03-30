const { fireStore } = require('../../config/firestore');

function formatDate(dateString) {
	const date = new Date(dateString);
	return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).replace(',', '');
}

async function updateInsights(insights) {
	if (Object.keys(insights).length === 0) {
		console.log('No insight data to update');
		return null;
	}

	console.log('Updating insights for song IDs:', Object.keys(insights));

	const batch = fireStore.batch();

	for (const id of Object.keys(insights)) {
		const insight = insights[id];
		const insightRef = fireStore.collection('insights').doc(id);

		try {
			// Fetch only if necessary
			let updatedData = insight;
			const doc = await insightRef.get();

			if (doc.exists) {
				updatedData = mergeData(doc.data(), insight);
			}

			batch.set(
				insightRef,
				{
					...updatedData,
					lastRefresh: formatDate(new Date()),
					// uniqueVisitors: Object.keys(updatedData.visitors).length,
				},
				{ merge: true }
			);
		} catch (error) {
			console.error(`Error fetching insight for ID ${id}:`, error);
		}
	}

	try {
		await batch.commit();
		console.log('Insights updated successfully');
		return { success: true };
	} catch (error) {
		console.error('Error updating insights:', error);
		return { success: false, error };
	}
}

function mergeData(obj1, obj2) {
	if (!obj1) return obj2;
	if (!obj2) return obj1;

	function deepMerge(target, source) {
		for (const key of Object.keys(source)) {
			if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
				if (!target[key]) target[key] = {};
				deepMerge(target[key], source[key]);
			} else if (typeof source[key] === 'number') {
				target[key] = (target[key] || 0) + source[key];
			} else {
				target[key] = source[key];
			}
		}
	}

	const merged = { ...obj1 };
	deepMerge(merged, obj2);
	return merged;
}
// Merges new insight data with existing Firestore data.
function mergeData2(existingData, newData) {
	const mergedData = structuredClone(existingData) || {}; // Deep clone for safety

	for (const key in newData) {
		if (typeof newData[key] === 'object' && newData[key] !== null && !Array.isArray(newData[key])) {
			mergedData[key] = mergeData(existingData[key] ?? {}, newData[key]);
		} else if (typeof newData[key] === 'number' && typeof existingData[key] === 'number') {
			mergedData[key] = existingData[key] + newData[key];
		} else {
			mergedData[key] = newData[key]; // Keep non-numeric values
		}
	}
	return mergedData;
}
// async function createCollectionIfNotExists(collectionName) {
// 	const collectionRef = fireStore.collection(collectionName);
// 	const snapshot = await collectionRef.limit(1).get();
// 	if (snapshot.empty) {
// 		await collectionRef.add({ initialized: true });
// 		console.log(`Collection ${collectionName} created.`);
// 	} else {
// 		console.log(`Collection ${collectionName} already exists.`);
// 	}
// }

module.exports = updateInsights;
