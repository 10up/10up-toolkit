/**
 * External dependencies
 */
const babelJest = require('babel-jest');

module.exports = babelJest.default.createTransformer({
	presets: [[require.resolve('@10up/babel-preset-default'), { wordpress: true }]],
});
