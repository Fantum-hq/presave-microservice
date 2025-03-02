const host = process.env.REDIS_HOST;
const QUEUES = {
	taskQueue: {
		redis: 'redis://redis:6379',
	},
	converterQueue: {
		redis: 'redis://redis:6379',
	},
	insightsQueue: {
		redis: 'redis://redis:6379',
	},
};

module.exports = { QUEUES };
