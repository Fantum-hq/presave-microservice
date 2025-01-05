//  presave Route and all information to locate the controller
const { storePresaveDetails } = require('../controllers/presave.Controller');

const express = require('express');
const router = express.Router();

router.post("/store-details", storePresaveDetails);

module.exports = router;
