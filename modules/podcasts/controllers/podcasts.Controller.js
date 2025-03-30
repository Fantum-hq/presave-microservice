const podcastSearch = require('../../../utils/podcasts/podcastSearch');

module.exports.searchPodcastQuery = async function (req, res) {
	try {
		const { query } = req.body;
		console.log({ query });

		const searchResults = await podcastSearch(query);

		res.status(200).json({ results: searchResults });
	} catch (e) {
		res.status(500).json({ error: e });
	}
};
