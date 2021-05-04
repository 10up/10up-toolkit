module.exports = {
	setupFilesAfterEnv: ['./setupTests.js'],
	testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(j|t)sx?$',
	moduleFileExtensions: ['js', 'jsx'],
	testPathIgnorePatterns: ['/node_modules/', '/mocks/'],
	moduleNameMapper: {
		'\\.css$': require.resolve('./test-utils/style-mock'),
	},
	moduleDirectories: ['node_modules', './'],
	collectCoverageFrom: [
		'**/*.{js,jsx}',
		'!**/node_modules/**',
		'!**/vendor/**',
		'!**/dist/**',
		'!**/build/**',
		'!**/jest.config.{js,ts}',
		'!**/babel.config.{js,ts}',
	],
};
