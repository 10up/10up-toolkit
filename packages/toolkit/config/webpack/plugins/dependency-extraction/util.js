/**
 * Utility functions for WordPress dependency extraction
 * Forked from @wordpress/dependency-extraction-webpack-plugin
 */

/* eslint-disable consistent-return, default-case */

const WORDPRESS_NAMESPACE = '@wordpress/';
const BUNDLED_PACKAGES = [
	'@wordpress/admin-ui',
	'@wordpress/dataviews',
	'@wordpress/dataviews/wp',
	'@wordpress/icons',
	'@wordpress/interface',
	'@wordpress/sync',
	'@wordpress/undo-manager',
	'@wordpress/upload-media',
	'@wordpress/fields',
	'@wordpress/views',
];

/**
 * Given a string, returns a new string with dash separators converted to
 * camelCase equivalent.
 *
 * @param {string} string Input dash-delimited string.
 * @returns {string} Camel-cased string.
 */
function camelCaseDash(string) {
	return string.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Default request to global transformation
 *
 * @param {string} request Module request
 * @returns {string|string[]|undefined} The resulting external definition
 */
function defaultRequestToExternal(request) {
	switch (request) {
		case 'moment':
			return request;

		case '@babel/runtime/regenerator':
			return 'regeneratorRuntime';

		case 'lodash':
		case 'lodash-es':
			return 'lodash';

		case 'jquery':
			return 'jQuery';

		case 'react':
			return 'React';

		case 'react-dom':
			return 'ReactDOM';

		case 'react/jsx-runtime':
		case 'react/jsx-dev-runtime':
			return 'ReactJSXRuntime';
	}

	if (request.includes('react-refresh/runtime')) {
		return 'ReactRefreshRuntime';
	}

	if (BUNDLED_PACKAGES.includes(request)) {
		return undefined;
	}

	if (request.startsWith(WORDPRESS_NAMESPACE)) {
		return ['wp', camelCaseDash(request.substring(WORDPRESS_NAMESPACE.length))];
	}
}

/**
 * Default request to external module transformation
 *
 * @param {string} request Module request
 * @returns {string|Error|undefined} The resulting external definition
 */
function defaultRequestToExternalModule(request) {
	if (request === '@wordpress/interactivity') {
		return `module ${request}`;
	}

	switch (request) {
		case '@wordpress/interactivity-router':
		case '@wordpress/a11y':
			return `import ${request}`;
	}

	const isWordPressScript = Boolean(defaultRequestToExternal(request));

	if (isWordPressScript) {
		throw new Error(
			`Attempted to use WordPress script in a module: ${request}, which is not supported yet.`,
		);
	}
}

/**
 * Default request to WordPress script handle transformation
 *
 * @param {string} request Module request
 * @returns {string|undefined} WordPress script handle
 */
function defaultRequestToHandle(request) {
	switch (request) {
		case '@babel/runtime/regenerator':
			return 'regenerator-runtime';

		case 'lodash-es':
			return 'lodash';

		case 'react/jsx-runtime':
			return 'react-jsx-runtime';
	}

	if (request.includes('react-refresh/runtime')) {
		return 'wp-react-refresh-runtime';
	}

	if (request.startsWith(WORDPRESS_NAMESPACE)) {
		return `wp-${request.substring(WORDPRESS_NAMESPACE.length)}`;
	}
}

module.exports = {
	camelCaseDash,
	defaultRequestToExternal,
	defaultRequestToExternalModule,
	defaultRequestToHandle,
};
