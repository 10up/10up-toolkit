module.exports = {
	testEnvironment: 'jsdom',
	testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/test/*.[jt]s?(x)', '**/?(*.)test.[jt]s?(x)'],
	testPathIgnorePatterns: ['/node_modules/', '<rootDir>/vendor/'],
	setupFilesAfterEnv: ['@wordpress/jest-console'],
};
