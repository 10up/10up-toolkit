module.exports = {
	testEnvironment: 'node',
	testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/test/*.[jt]s?(x)', '**/?(*.)test.[jt]s?(x)'],
	testPathIgnorePatterns: ['/node_modules/', '<rootDir>/vendor/', '/__fixtures__/', '/dist/'],
	setupFilesAfterEnv: [require.resolve('@wordpress/jest-console')],
	resolver: './test-utils/resolver.js',
	snapshotSerializers: ['./test-utils/webpack-serializer.js'],
};
