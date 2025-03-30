const Queue = require('bull');
const { getFantumInsights } = require('../modules/insights/services/insights.Service');
const { initInsightsQueue } = require('./insightsQueue');
const { insightsQueue } = require('./insightsQueue'); // Adjust the path as necessary

jest.mock('bull');
jest.mock('../modules/insights/services/insights.Service', () => ({
	getFantumInsights: jest.fn().mockResolvedValue({}),
}));

// Mock Redis connection
jest.mock('ioredis', () => {
	return jest.fn().mockImplementation(() => ({
		on: jest.fn(),
	}));
});

// Set environment variables for the test
process.env.NODE_ENV = 'development';

describe('insightsQueue', () => {
	beforeAll(() => {
		insightsQueue.isReady = jest.fn().mockResolvedValue(true);
		insightsQueue.empty = jest.fn().mockResolvedValue();
		insightsQueue.add = jest.fn();
		insightsQueue.process = jest.fn();
	});

	it('should initialize the queue and add a job', async () => {
		await initInsightsQueue();

		expect(insightsQueue.isReady).toHaveBeenCalled();
		expect(insightsQueue.empty).toHaveBeenCalled();
		expect(insightsQueue.add).toHaveBeenCalledWith({}, { repeat: { cron: '*/2 * * * *' } });
	});

	it('should process the jobs in the queue', async () => {
		const job = { id: 'test-job' };
		insightsQueue.process.mockImplementationOnce(callback => callback(job));

		let res;
		await insightsQueue.process(async job => {
			res = await getFantumInsights('INTERVAL 2 MINUTE');
		});

		expect(getFantumInsights).toHaveBeenCalledWith('INTERVAL 2 MINUTE');
		expect(res).toBeInstanceOf(Object);
		console.log(res);
	});
});
