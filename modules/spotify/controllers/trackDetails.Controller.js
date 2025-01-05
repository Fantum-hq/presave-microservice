const  axios  = require("axios");

const {
    SPOTIFY_TRACK_URL
} = process.env;

const trackDetailsController = async (req, res) => {
    const { songId } = req.query;

    if (!songId) {
        return res.status(400).json({ error: "Song ID is required" });
    }

    const accessToken = req.headers.authorization; // Extract the access token

    if (!accessToken) {
        return res.status(401).json({ error: "Unauthorized. No access token." });
    }
    try {
        // Fetch track details from Spotify using the track ID
        const trackResponse = await axios.get(SPOTIFY_TRACK_URL + songId, {
            headers: {
                Authorization: `${accessToken}`,
                "Content-Type": "application/json",
            },
        });
        console.log(trackResponse);
        
        // Send track details to the frontend
        res.status(200).json({
            id: trackResponse.data.id,
            name: trackResponse.data.name,
            artists: trackResponse.data.artists.map((artist) => artist.name),
            album: trackResponse.data.album,
        });
    } catch (error) {
        // console.error(error);
        res.status(500).json({ error });
    }
}

module.exports = { trackDetailsController };