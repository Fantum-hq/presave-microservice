module.exports = {
	testEnvironment: 'node',
	collectCoverage: false,
	runMode: 'on-demand',
	coverageDirectory: 'coverage',
	setupFilesAfterEnv: ['./jest.setup.js'],
	testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
