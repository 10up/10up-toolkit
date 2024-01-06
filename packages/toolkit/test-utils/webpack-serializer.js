const path = require('path');

/**
 * Checks if the provided value is a string
 *
 * @param {*} val The value to check.
 *
 * @returns {boolean}
 */
const isString = (val) => val && typeof val === 'string';

/**
 * Convert Windows backslash paths to posix slash paths: foo\\bar ➔ foo/bar
 *
 * @param {string} val The value to normalize.
 * @returns {string}
 */
const normalizeSlashes = (val) => {
	const isExtendedLengthPath = /^\\\\\?\\/.test(val);
	const hasNonAscii = /[^\u0000-\u0080]+/.test(val); // eslint-disable-line no-control-regex

	if (isExtendedLengthPath || hasNonAscii) {
		return val;
	}

	return val.replace(/\\/g, '/').replace(/\/\//g, '/');
};

const rootDir = normalizeSlashes(path.dirname(path.dirname(process.cwd())));
const processDir = normalizeSlashes(process.cwd());

/**
 * Checks if the provided value has a local path
 *
 * @param {string} val The value to check.
 *
 * @returns {boolean}
 */
const hasLocalPath = (val) => {
	const normalizedPath = normalizeSlashes(val);
	return normalizedPath.includes(processDir) || normalizedPath.includes(rootDir);
};

/**
 * Checks if the provided value is a webpack plugin
 *
 * @param {*} val The value to check.
 *
 * @returns {boolean}
 */
const isWebPackPlugin = (val) => {
	return typeof val === 'object' && typeof val.apply === 'function';
};

/**
 * Removes local path from the given value.
 *
 * @param {string} val The value to remove local path from.
 *
 * @returns {string}
 */
const removeLocalPath = (val) => {
	const localPath = normalizeSlashes(val);

	return localPath
		.replace(new RegExp(processDir, 'ig'), '')
		.replace(new RegExp(rootDir, 'ig'), '');
};

/**
 * Prints a normalized version of a webpack plugin object.
 *
 * @param {object} plugin The webpack plugin.
 *
 * @returns {string}
 */
const printWebPackPlugin = (plugin) => {
	const options = plugin.options ? plugin.options : {};

	['maxConcurrency', 'experimentalUseImportModule'].forEach((key) => {
		if (typeof options[key] !== 'undefined') {
			delete options[key];
		}
	});

	return `${plugin.name || plugin.constructor.name}: ${removeLocalPath(JSON.stringify(options))}`;
};

module.exports = {
	serialize(val, config, indentation, depth, refs, printer) {
		if (isString(val) && hasLocalPath(val)) {
			return printer(removeLocalPath(val), config, indentation, depth, refs);
		}

		if (isWebPackPlugin(val)) {
			return printer(printWebPackPlugin(val), config, indentation, depth, refs);
		}

		if (typeof val === 'function') {
			return printer(val.toString(), config, indentation, depth, refs);
		}

		return printer(val, config, indentation, depth, refs);
	},

	test(val) {
		let shouldProcess = isString(val) && hasLocalPath(val);
		shouldProcess = shouldProcess || isWebPackPlugin(val);
		shouldProcess = shouldProcess || typeof val === 'function';

		return shouldProcess;
	},
};
