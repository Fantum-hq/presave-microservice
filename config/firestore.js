const firebase = require('firebase-admin');
const serviceAccount = require('../utils/service-account-key.json');

// Initialize Firebase app using the service account key
firebase.initializeApp({
	credential: firebase.credential.cert(serviceAccount), // Pass the service account directly
	projectId: 'fantum-2cc34', // Replace with your Firebase project ID
});

// Get a reference to Firestore
const fireStore = firebase.firestore();
fireStore.settings({
	ignoreUndefinedProperties: true, // This will ignore undefined properties when writing to Firestore
});
module.exports = { fireStore };
