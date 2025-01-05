const axios = require("axios");

const addSongController = async (req, res) => {
    const { songUrl, libraryId } = req.body;
    const accessToken = req.headers.authorization; // Extract token 
    try {

        console.log('songUrl:', songUrl);  // Log the song URL for debugging
        console.log('accessToken:', accessToken);  // Log the access token for debugging
        console.log('libraryId:', libraryId);  // Log the libraryId for debugging
        // Validate that the URL is a valid Spotify song URL
        const trackIdRegex = /spotify\.com\/track\/([a-zA-Z0-9]{22})/;
        const match = songUrl.match(trackIdRegex);

        if (!match) {
            return res.status(400).send('Invalid Spotify song URL');
        }

        const trackId = match[1]; // Extract trackId from songUrl

        // Determine the endpoint based on the libraryId
    
        let addTrackResponse = "";
        if (libraryId === 'my-library') {
            // Add to the user's library
             addTrackResponse = await axios.put(
                `https://api.spotify.com/v1/me/tracks?ids=${trackId}`,
                null,
                {
                    headers: {
                        Authorization: `${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
        } else {
            // Add track to the selected library
             addTrackResponse = await axios.post(
                `https://api.spotify.com/v1/playlists/${libraryId}/tracks?uris=spotify:track:${trackId}`,
                null,
                {
                    headers: {
                        Authorization: `${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

        }


        console.log("addTrackResponse:", addTrackResponse);

        return res.status(200).json({ message: 'Song added to your library successfully!', addTrackResponse });
    } catch (error) {
        console.error(error);
        // return res.status(200)
    }
}

module.exports = { addSongController };