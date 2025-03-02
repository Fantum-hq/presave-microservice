const { getFantumInsights } = require('../services/insights.Service');
const fs = require('fs');
const csv = require('csv-parser');
const updateInsights = require('../../../utils/firebase/updateInsights');
const { BatchProcessData } = require('../../../utils/insights');

const getLinkInsights = async (req, res) => {
	// liveVisitors
	// uniqueVisitors
	// totalPageviews
	// totalPageviews
	// bounceRate
	// averageSession

	try {
		// if (false) {
		// 	return res.status(400).json({ error: ''});
		// }
		const insights = await getFantumInsights();
		res.status(200).json({
			message: 'Insights retrieved successfully',
			insights: insights ?? 'none',
			insightsLength: Object.keys(insights)?.length ?? 0,
		});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({ error: error.message });
	}
};
const getAllInsights = async (req, res) => {
	try {
		// if (false) {
		// 	return res.status(400).json({ error: ''});
		// }
		const insights = await getFantumInsights();
		res.status(200).json({
			message: 'Insights retrieved successfully',
			insights: insights ?? 'none',
			insightsLength: Object.keys(insights)?.length ?? 0,
		});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({ error: error.message });
	}
};

const rebaseInsights = async (req, res) => {
	try {
		const results = [];

		const filePath = __dirname + '/fantum-insights-27-02-25.csv';

		console.log(filePath);
		fs.createReadStream(filePath)
			.pipe(csv())
			.on('data', data => results.push(data))
			.on('end', async () => {
				const compiledResults = results.map(result => {
					const compiledResult = {};
					for (const key in result) {
						if (key.includes('.')) {
							const keys =
								key.split('.');
							if (
								!compiledResult[
									keys[0]
								]
							) {
								compiledResult[
									keys[0]
								] = {};
							}
							compiledResult[keys[0]][
								keys[1]
							] = result[key];
						} else {
							compiledResult[key] =
								result[key];
						}
					}
					return compiledResult;
				});
				console.log(compiledResults[0]);
				const pd = BatchProcessData(compiledResults);

				pd && console.log(pd[Object.keys(pd)[0]]);

				await updateInsights(pd);
				res.status(200).json({
					message: 'Insights rebased successfully',
					updatedInsights: results.length,
				});
			});
	} catch (error) {
		console.error('Error:', error.message);
		res.status(500).json({ error: error.message });
	}
};

module.exports = { getAllInsights, rebaseInsights, getLinkInsights };
