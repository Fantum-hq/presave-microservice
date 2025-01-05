const { validationResult } = require("express-validator");
const { fireStore } = require("../../../config/firestore");
const { scheduleTask } = require("../../../services/taskQueue");
const moment = require("moment");
const generateRandomId = () => {
    const randomId = `creatorId-${Date.now()}${Math.floor(Math.random() * 10000000000000000)}`;
    return randomId;
};
const preSaveController = async (req, res) => {
    try {
        // Validate request input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { artist, songLink, title, releaseDate, timeZone, providers } = req.body;

        // Query the "presaves" collection to check for its existence
        const presavesSnapshot = await fireStore.collection("presaves").limit(1).get();

        // If the collection does not exist, presavesSnapshot.empty will be true
        if (presavesSnapshot.empty) {
            console.log("No 'presaves' collection found. Creating a new one...");
        }

        // Create a new presave document
        const newPresaveData = {
            creatorId: generateRandomId(), //replace withUser UUID
            title,
            artist,
            releaseDate,
            timeZone,
            providers,
            songLink,
            createdAt: new Date().toISOString(), // Add a timestamp for tracking
        };

        const newPresaveRef = await fireStore.collection("presaves").add(newPresaveData);

        res.status(201).json({
            message: "Presave created successfully",
            id: newPresaveRef.id,
            ...newPresaveData,
        });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// Controller to handle fetching presaves by id or creatorId
const getPresaveController = async (req, res) => {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ error: "Either 'id' is required to fetch a presave." });
        }

        let querySnapshot;
        if (id) {
            // Fetch presave by ID
            querySnapshot = await fireStore.collection("presaves").doc(id).get();

        }

        if (!querySnapshot.exists && querySnapshot.empty) {
            return res.status(404).json({ error: "Presave not found." });
        }

        const presaveData = querySnapshot.data ? querySnapshot.data() : querySnapshot.docs[0].data();

        res.status(200).json({
            message: "Presave retrieved successfully",
            presave: { ...presaveData, id: querySnapshot.id },

        });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};



// Function to fetch presave data and schedule the task
const handlePresave = async (req, res) => {
    const { presaveID } = req.params;
    const { accessToken, libraryId = "my-library" } = req.body;

    try {
        // Fetch presave data from Firestore
        const presaveRef = fireStore.collection("presaves").doc(presaveID);
        const presaveDoc = await presaveRef.get();

        if (!presaveDoc.exists) {
            return res.status(404).json({ error: "Presave not found" });
        }

        const presaveData = presaveDoc.data();
        const { songLink, releaseDate, timeZone } = presaveData;

        // Query users collection to find the user by accessToken
        const usersRef = fireStore.collection("users");
        const querySnapshot = await usersRef.where("spotify.accessToken", "==", accessToken).get();

        if (querySnapshot.empty) {
            return res.status(404).json({ error: "User not found for the provided access token." });
        }

        // Assuming there is only one document that matches the accessToken
        const userDoc = querySnapshot.docs[0];
        const userId = userDoc.id;

        // Convert release date to the user's time zone
        const releaseTime = new Date(releaseDate);
        const userReleaseTime = moment.tz(releaseTime, timeZone).toDate();
        console.log("User release time:", timeZone, userReleaseTime);
        // Schedule the task
        scheduleTask({ userReleaseTime, userId, songLink, accessToken, timeZone, libraryId });

        return res.status(200).json({ message: "Song scheduling successful." });
    } catch (error) {
        console.error("Error handling presave:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};



module.exports = { preSaveController, getPresaveController, handlePresave };