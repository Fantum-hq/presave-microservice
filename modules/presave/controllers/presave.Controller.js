const { validationResult } = require("express-validator");
const { fireStore } = require("../../../config/firestore");

const generateRandomId = () => {
    const randomId = `creatorId-${Date.now()}${Math.floor(Math.random() * 10000000000000000)}`;
    return randomId;
};

const storePresaveDetails = async (req, res) => {
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



module.exports = { storePresaveDetails };