module.exports = {
	testEnvironment: 'node',
	collectCoverage: true,
	coverageDirectory: 'coverage',
	setupFilesAfterEnv: ['./jest.setup.js'],
	testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
