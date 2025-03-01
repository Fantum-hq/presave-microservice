//  presave Route and all information to locate the controller
const {
	storePresaveDetails,
	getPresaveDetails,
} = require('../controllers/presave.Controller');
const { converterQueue } = require('../../../services/converterQueue');

const express = require('express');
const router = express.Router();

router.post('/store-details', storePresaveDetails);
router.get('/get-details', getPresaveDetails);
router.get('/test', async (req, res) => {
	converterQueue.add(
		{ type: 'test', data: { test: 'good' } },
		{ delay: 40000 }
	);
	res.status(200).json({ message: 'testing' });
});

module.exports = router;
