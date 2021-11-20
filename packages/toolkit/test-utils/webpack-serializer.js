const path = require('path');

const rootDir = path.dirname(path.dirname(process.cwd()));

/**
 * Checks if the provided value is a string
 *
 * @param {*} val The value to check.
 *
 * @returns {boolean}
 */
const isString = (val) => val && typeof val === 'string';

/**
 * Checks if the provided value has a local path
 *
 * @param {string} val The value to check.
 *
 * @returns {boolean}
 */
const hasLocalPath = (val) => {
	return val.indexOf(process.cwd()) !== -1 || val.indexOf(rootDir) !== -1;
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
	return val.replace(new RegExp(process.cwd(), 'ig'), '').replace(new RegExp(rootDir, 'ig'), '');
};

/**
 * Prints a normalized version of a webpack plugin object.
 *
 * @param {object} plugin The webpack plugin.
 *
 * @returns {string}
 */
const printWebPackPlugin = (plugin) => {
	const options = plugin?.options || {};

	['maxConcurrency', 'experimentalUseImportModule'].forEach((key) => {
		if (typeof options[key] !== 'undefined') {
			delete options[key];
		}
	});

	return `${plugin?.name || plugin?.constructor?.name}: ${removeLocalPath(
		JSON.stringify(options),
	)}`;
};

module.exports = {
	serialize(val) {
		if (isString(val) && hasLocalPath(val)) {
			return `"${removeLocalPath(val)}"`;
		}

		if (isWebPackPlugin(val)) {
			return printWebPackPlugin(val);
		}

		if (typeof val === 'function') {
			return val.toString();
		}

		return val;
	},

	test(val) {
		let shouldProcess = isString(val) && hasLocalPath(val);
		shouldProcess ||= isWebPackPlugin(val);
		shouldProcess ||= typeof val === 'function';

		return shouldProcess;
	},
};
