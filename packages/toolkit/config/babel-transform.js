/**
 * External dependencies
 */
const babelJest = require('babel-jest');

module.exports = babelJest.createTransformer({
	presets: [['@10up/babel-preset-default', { wordpress: true }]],
});
