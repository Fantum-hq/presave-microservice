const { fireStore } = require('../../config/firestore');
async function getUsersLinks(userId) {
	const userDoc = fireStore.doc(`users/${userId}`);
	const _user = await userDoc.get();
	if (!_user.exists) {
		return null;
	}

	const { userId: uid } = _user.data();
	const linksCol = fireStore.collection('smart-links');

	const _links = await linksCol.where('creatorId', '==', uid).get();
	if (_links.empty) {
		return null;
	}

	const links = [];
	_links.docs.forEach(link => links.push(link.data()));

	return links;
}

module.exports = getUsersLinks;
