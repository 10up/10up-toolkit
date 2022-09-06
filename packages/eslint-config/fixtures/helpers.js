/**
 * Returns a reference to an eslint config file.
 * Reads the `--config-file` positional argument and defaults to `./index` if nothing is passed.
 *
 * @returns {string} The eslint config file.
 */
const getConfigFile = () => {
	const configArgs = process.argv.filter((arg) => arg.includes('--config-file'));

	if (!configArgs || configArgs.length < 1) {
		return '';
	}

	return configArgs[0].replace('--config-file=', '');
};

console.log('Test')

/**
 * Consolidate results.
 *
 * @param {object[]} results Arra of results
 *
 * @returns {object}
 */
const countResults = (results) =>
	results.reduce(
		(counts, file) => ({
			errors: counts.errors + file.errorCount,
			warnings: counts.warnings + file.warningCount,
			files: counts.files + 1,
		}),
		{
			errors: 0,
			warnings: 0,
			files: 0,
		},
	);

module.exports = {
	getConfigFile,
	countResults,
};
