const { fireStore } = require('../../config/firestore');

const getTopViewedInsight = async () => {
	try {
		const snapshot = await fireStore
			.collection('insights')
			.orderBy('totalPageviews', 'desc') // Order by totalPageviews in descending order
			.limit(1) // Get the top result
			.get();

		if (snapshot.empty) {
			console.log('No insights found.');
			return null;
		}

		const topDoc = snapshot.docs[0]; // Get the first (and only) result
		// console.log('Top Insight:', topDoc.id, topDoc.data());
		return { id: topDoc.id, ...topDoc.data() };
	} catch (error) {
		console.error('Error fetching top insight:', error);
		return null;
	}
};

module.exports = getTopViewedInsight;
