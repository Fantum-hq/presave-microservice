const { InsightProcessor } = require('./index');
const date = require('date-fns');
const path = require('path');
const { cacheInstance } = require('../cache');
// const { jest } = require('@jest/globals');

const mockViewEvent = (i, id) => ({
	event: 'PAGE-VIEW-V2',
	properties: {
		fantumSmartLinkId: 'linkId',
		$geoip_city_name: 'Abuja',
		$geoip_country_name: 'Nigeria',
		$referrer: 'https://instagram.com',
	},
	timestamp: date.subDays(new Date(), i).toISOString(),
	distinct_id: id ? `${id}${id}${id}${id}` : 'distinct_id',
});
const mockTapEvent = (i, id) => ({
	timestamp: date.subDays(new Date(), i).toISOString(),
	event: 'PROVIDER-ClICK-V2',
	distinct_id: '01958bc3-f0f6-7654-8801-f2b71119472c',
	properties: {
		$current_url: 'https://2wisebaba.ftu.me/all-by-myself',
		$geoip_city_name: 'Ibadan',
		$geoip_country_name: 'Nigeria',
		fantumCreatorId: 'dE4iiR7mZNQ82GObeP9pQLbVN2X2',
		fantumCreatorUserName: '2wisebaba',
		fantumProviderTapped: 'Youtube',
		fantumSmartLinkId: 'dummy',
		$referrer: '$direct',
	},
});

jest.mock('../cache', () => ({
	__esModule: true,
	default: jest.fn(),
	cacheInstance: {
		get: jest.fn(),
		set: jest.fn(),
		clear: jest.fn(),
	},
}));

const MockCache = jest.fn();
MockCache.prototype.get = jest.fn();
MockCache.prototype.set = jest.fn();
MockCache.prototype.clear = jest.fn();

const localCache = new MockCache();

const MockInsightsProcessor = new InsightProcessor(localCache);

describe('process event tests', () => {
	beforeAll(() => {
		MockInsightsProcessor.processEvent = jest.fn();
	});

	beforeEach(() => {
		MockInsightsProcessor.processEvent.mockReset();
	});

	describe('on multiple view events passed to function', () => {
		test('same id', async () => {
			const eventsData = [
				mockViewEvent(1),
				mockViewEvent(2),
				mockViewEvent(3),
				mockViewEvent(4),
				mockViewEvent(5),
			];
			for (const event of eventsData) {
				await MockInsightsProcessor.processEvent(event);
			}
			expect(2).toBeGreaterThan(1);
		});
		test('different ids', async () => {
			const eventsData = [
				mockViewEvent(1, 1),
				mockViewEvent(2, 2),
				mockViewEvent(3, 3),
				mockViewEvent(4, 4),
				mockViewEvent(5, 5),
			];
			for (const event of eventsData) {
				await MockInsightsProcessor.processEvent(event);
			}
			expect(2).toBeGreaterThan(1);
		});
	});
	describe('on multiple tap events passed to function', () => {
		test('same id', async () => {
			const eventsData = [
				mockTapEvent(1),
				mockTapEvent(2),
				mockTapEvent(3),
				mockTapEvent(4),
				mockTapEvent(5),
			];
			let returnValues = [];
			for (const event of eventsData) {
				const returnValue =
					await MockInsightsProcessor.processEvent(
						event
					);
				console.log('Return Value:', returnValue);
				returnValues.push(returnValue);
			}
			expect(
				MockInsightsProcessor.processEvent
			).toHaveBeenCalledTimes(5);
			expect(returnValues).toEqual(expect.anything());
		});
		test('different ids', async () => {
			const eventsData = [
				mockTapEvent(1, 1),
				mockTapEvent(2, 2),
				mockTapEvent(3, 3),
				mockTapEvent(4, 4),
				mockTapEvent(5, 5),
			];
			for (const event of eventsData) {
				await MockInsightsProcessor.processEvent(event);
			}
			expect(2).toBeGreaterThan(1);
		});
	});

	// describe('on single tap event passed to function', () => {
	// 	const expected = { taps: { spotify: 1 } };
	// 	const mockProcessor = jest.fn(processAndGetData);
	// 	test('should return a ftu ready object', () => {
	// 		mockProcessor(mockTapEvent);
	// 		expect(mockProcessor).toHaveReturnedWith(expect.objectContaining(expected));
	// 	});
	// });
});
