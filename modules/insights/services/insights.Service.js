const updateInsights = require('../../../utils/firebase/updateInsights');
const {
	BatchGetEvents10,
	BatchProcessData,
} = require('../../../utils/insights');

const getFantumInsights = async () => {
	try {
		const insights = await BatchGetEvents10();
		const processedInsights = BatchProcessData(insights);
		return processedInsights;
	} catch (error) {
		console.error('Error:', error.message);
		return { error: error.message };
	}
};

module.exports = { getFantumInsights };
