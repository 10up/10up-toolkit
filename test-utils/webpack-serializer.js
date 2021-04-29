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
const hasLocalPath = (val) => val.indexOf(process.cwd()) !== -1;

/**
 * Checks if the provided value is a webpack plugin
 *
 * @param {*} val The value to check.
 *
 * @returns {boolean}
 */
const isWebPackPlugin = (val) => {
	return typeof val === 'object' && val?.apply && typeof val?.apply === 'function';
};

/**
 * Removes local path from the given value.
 *
 * @param {string} val The value to remove local path from.
 *
 * @returns {string}
 */
const removeLocalPath = (val) => {
	return val.replace(new RegExp(process.cwd(), 'ig'), '');
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
		if (options[key]) {
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

		return val;
	},

	test(val) {
		let shouldProcess = isString(val) && hasLocalPath(val);
		shouldProcess ||= isWebPackPlugin(val);

		return shouldProcess;
	},
};
