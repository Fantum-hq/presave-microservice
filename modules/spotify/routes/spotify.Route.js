// Import necessary controllers from your path
const { loginController } = require('../controllers/login.Controller');
const { callbackController } = require('../controllers/callBack.Controller');
const { addSongController } = require('../controllers/addSong.Controller');
const { trackDetailsController } = require('../controllers/trackDetails.Controller');
const { getLibraryController } = require('../controllers/getLibrary.Controller');
const {  handlePresave } = require('../controllers/presave.Controller');  // Corrected path to `presave.Controller`

const express = require('express');
const router = express.Router();  // Create a router instance

// Define your routes
router.get('/login', loginController); // Spotify login it a redirect
router.get('/callback', callbackController); // Spotify callback
router.post('/add-song', addSongController); // Add song to library or playlist
router.get('/track-details', trackDetailsController); // Fetch track details
router.get('/get-libraries', getLibraryController); // Fetch user's libraries (playlists)
router.post("/presave-action", handlePresave); // Handle presave action

// Export the router
module.exports = router;
