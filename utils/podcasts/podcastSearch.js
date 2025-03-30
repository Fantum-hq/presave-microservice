// ======== Required values ========
// WARNING: don't publish these to public repositories or in public places!
// NOTE: values below are sample values, to get your own values go to https://api.podcastindex.org
const apiKey = process.env.PODCAST_APIKEY;
const apiSecret = process.env.PODCAST_SECRET;
// ======== Hash them to get the Authorization token ========
const crypto = require('crypto');

// ======== Send the request and collect/show the results ========
// const fetch = require('node-fetch');

async function podcastSearch(query) {
	const apiHeaderTime = Math.floor(Date.now() / 1000); //console.log(`apiHeaderTime=[${apiHeaderTime}]`);
	const sha1Algorithm = 'sha1';
	const sha1Hash = crypto.createHash(sha1Algorithm);
	const data4Hash = apiKey + apiSecret + apiHeaderTime;
	sha1Hash.update(data4Hash);
	const hash4Header = sha1Hash.digest('hex');
	let options = {
		method: 'get',
		headers: {
			// not needed right now, maybe in future:  "Content-Type": "application/json",
			'X-Auth-Date': '' + apiHeaderTime,
			'X-Auth-Key': apiKey,
			Authorization: hash4Header,
			'User-Agent': 'FANTUMAPI/1.2 (Linux; Podcast Search; help@fantum.me)',
		},
	};
	console.log(`hash4Header=[${hash4Header}]`);
	try {
		const url = 'https://api.podcastindex.org/api/1.0/search/byterm?q=' + query;
		const fetched = await fetch(url, options);
		const response = await fetched.json();
		const feeds = response.feeds;
		console.log('podcast', feeds);
		return feeds;
	} catch (e) {
		return e;
	}
}

module.exports = podcastSearch;
