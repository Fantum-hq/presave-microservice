// This file is used to process a single event in a batch
const { InsightProcessor } = require('./insightsProcessor');
const { cacheInstance } = require('./cache');

const processor = new InsightProcessor(cacheInstance);

const BatchSingle = async (event, i) => {
	try {
		await processor.processEvent(event);
	} catch (error) {
		console.error('Processing error:', error);
	}
};

module.exports = { BatchSingle };
