//  presave Route and all information to locate the controller
const { storePresaveDetails, getPresaveDetails } = require('../controllers/presave.Controller');

const express = require('express');
const router = express.Router();

router.post("/store-details", storePresaveDetails);
router.get("/get-details", getPresaveDetails);

module.exports = router;
