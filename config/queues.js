const host = process.env.REDIS_HOST;

// if (!host) {
// 	throw new Error('No redis host', { cause: 'env' });
// }

console.log(host);

const QUEUES = {
	taskQueue: {
		redis: host,
	},
	converterQueue: {
		redis: host,
	},
	insightsQueue: {
		redis: host,
	},
};

module.exports = { QUEUES };
