//  presave Route and all information to locate the controller
const { storePresaveDetails, getPresaveDetails } = require('../controllers/presave.Controller');

const express = require('express');
const router = express.Router();

router.post("/store-get", storePresaveDetails);
router.post("/get-details", getPresaveDetails);

module.exports = router;
