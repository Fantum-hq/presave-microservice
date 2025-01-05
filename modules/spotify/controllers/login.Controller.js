const {
    SPOTIFY_CLIENT_ID,
    SPOTIFY_REDIRECT_URI,
    SPOTIFY_AUTH_URL
} = process.env;

const loginController = (req, res) => {
    const scope = "user-library-modify user-read-private user-read-email playlist-modify-public playlist-modify-private";
   

    // Set the 'state' with the presaveID parameter (which could be passed in query params)
    const state = req.query.presaveID ? encodeURIComponent(req.query.presaveID) : '';

    const authUrl = `${SPOTIFY_AUTH_URL}?response_type=code&client_id=${SPOTIFY_CLIENT_ID}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}&state=${state}`;

    console.log("Redirecting to: ", authUrl);

    res.redirect(authUrl);
}

module.exports = { loginController };
