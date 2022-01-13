/**
 * External dependencies
 */
const path = require('path');

/**
 * Internal dependencies
 */
const { hasBabelConfig } = require('../utils');

const jestUnitConfig = {
	testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/test/*.[jt]s?(x)', '**/?(*.)test.[jt]s?(x)'],
	testPathIgnorePatterns: ['/node_modules/', '<rootDir>/vendor/'],
	timers: 'fake',
	setupFilesAfterEnv: ['@wordpress/jest-console'],
	moduleNameMapper: {
		'\\.(scss|css)$': path.join(__dirname, 'jest', 'style.mock.js'),
	},
	testEnvironment: 'jsdom',
};

if (!hasBabelConfig()) {
	jestUnitConfig.transform = {
		'^.+\\.[jt]sx?$': path.join(__dirname, 'babel-transform'),
	};
}

module.exports = jestUnitConfig;
