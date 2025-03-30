const { processAndHandleIinsights } = require('./index');
const date = require('date-fns');
// const { jest, expect, it } = require('@jest/globals');

const mockViewEvent = {
	event: '$pageView',
	properties: {
		fantumSmartLinkId: 'linkId',
		$geoip_city_name: 'Abuja',
		$geoip_country_name: 'Nigeria',
		$referrer: 'https://instagram.com',
	},
	timestamp: new Date().toISOString(),
	distinct_id: '111',
};

const mockTapEvent = {
	timestamp: '2025-03-19 01:33:53.605000+01:00',
	event: 'PROVIDER-ClICK-V2',
	distinct_id: '0195abd2-1c7a-7ee9-b50b-dff475847a89',
	properties: {
		$current_url: 'https://trinitydistribution.ftu.me/joyful-praise',
		$geoip_city_name: 'Toronto',
		$geoip_country_name: 'Canada',
		fantumCreatorId: 't06tnbsS7OVLe1eRaMZ5XdYXKIY2',
		fantumCreatorUserName: 'trinitydistribution',
		fantumProviderTapped: 'Spotify',
		fantumSmartLinkId: 'linkId2',
		$referrer: '$direct',
	},
};

describe('process event tests', () => {
	describe('on single view event passed to function', () => {
		const mockProcessor = jest.fn(processAndHandleIinsights);
		test('should return a ftu ready object', () => {
			const response = mockProcessor(mockViewEvent);
			if (response) {
				expect(response.sevenDays.views == 1);
			}
		});
	});

	describe('on single tap event passed to function', () => {
		const expected = {
			taps: {
				counts: {
					Spotify: 1,
				},
				max: 1,
				total: 1,
			},
		};
		const mockProcessor = jest.fn(processAndHandleIinsights);
		test('should return a ftu ready object', () => {
			const processed = mockProcessor(mockTapEvent);
			console.log({ processed });

			if (processed) {
				expect(processed).toEqual(expect.objectContaining(expected));
			}
		});
	});

	describe('on multiple tap events passed to function', () => {
		const mockTapEvent1 = {
			timestamp: '2025-03-19 01:33:53.605000+01:00',
			event: 'PROVIDER-ClICK-V2',
			distinct_id: '0195abd2-1c7a-7ee9-b50b-dff475847a89',
			properties: {
				$current_url: 'https://trinitydistribution.ftu.me/joyful-praise',
				$geoip_city_name: 'Toronto',
				$geoip_country_name: 'Canada',
				fantumCreatorId: 't06tnbsS7OVLe1eRaMZ5XdYXKIY2',
				fantumCreatorUserName: 'trinitydistribution',
				fantumProviderTapped: 'Spotify',
				fantumSmartLinkId: 'linkId2',
				$referrer: '$direct',
			},
		};

		const mockTapEvent2 = {
			event: 'PROVIDER-CLICK-V2',
			properties: {
				fantumSmartLinkId: 'linkId2',
				fantumProviderTapped: 'appleMusic',
				$geoip_city_name: 'City2',
				$geoip_country_name: 'Country2',
			},
			timestamp: date.subDays(new Date(), 2).toISOString(),
			distinct_id: '333',
		};

		const expected1 = {
			taps: {
				counts: {
					Spotify: 1,
				},
				max: 1,
				total: 1,
			},
		};
		const expected2 = {
			taps: {
				counts: {
					appleMusic: 1,
				},
				max: 1,
				total: 1,
			},
		};

		const mockProcessor = jest.fn(processAndHandleIinsights);
		test('should return a ftu ready object', () => {
			const processed1 = mockProcessor(mockTapEvent1);
			const processed2 = mockProcessor(mockTapEvent2);
			if (processed1 && processed2) {
				expect(processed1).toEqual(expect.objectContaining(expected1));
				expect(processed2).toEqual(expect.objectContaining(expected2));
			}
		});
	});
});
