const axios = require("axios");

const getLibraryController = async (req, res) => {
    const accessToken = req.headers.authorization; // Extract token

    try {
        const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
            headers: {
                Authorization: `${accessToken}`,
            },
        });

        // Include "My Library" as an option in the libraries list
        const libraries = [
            { id: 'my-library', name: 'My Library' },
            ...response.data.items.map(item => ({ id: item.id, name: item.name }))
        ];

        res.json(libraries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch libraries', error });
    }
}

module.exports = { getLibraryController };