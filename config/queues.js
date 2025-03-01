const host = process.env.REDIS_HOST;
const QUEUES = {
	taskQueue: {
		redis: { port: 6379, host },
	},
	converterQueue: {
		redis: { port: 6380, host },
	},
	insightsQueue: {
		redis: { port: 6382, host },
	},
};

module.exports = { QUEUES };
