const express = require('express');
const { searchPodcastQuery } = require('../controllers/podcasts.Controller');
const router = express.Router();

router.post('/search', searchPodcastQuery);

module.exports = router;
