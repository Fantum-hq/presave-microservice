const { fireStore } = require('../../../config/firestore');

module.exports.getInsightByLinkId = async function (id) {
	const _insight = await fireStore.doc(`insights/${id}`).get();
	const insight = _insight.data();
	console.log({ insight });

	return insight;
};
