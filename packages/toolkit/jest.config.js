module.exports = {
	testEnvironment: 'node',
	testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/test/*.[jt]s?(x)', '**/?(*.)test.[jt]s?(x)'],
	testPathIgnorePatterns: [
		'/node_modules/',
		'<rootDir>/vendor/',
		'/__fixtures__/',
		'/dist/',
		'__tests__/build-project-overriding-config-files/filenames.config.js',
	],
	setupFilesAfterEnv: [require.resolve('@wordpress/jest-console')],
	resolver: './test-utils/resolver.js',
	snapshotSerializers: ['./test-utils/webpack-serializer.js'],
};
