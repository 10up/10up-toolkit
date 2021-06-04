/**
 * External dependencies
 */
const babelJest = require('babel-jest');

module.exports = babelJest.createTransformer({
	presets: [[require.resolve('@10up/babel-preset-default'), { wordpress: true }]],
});
