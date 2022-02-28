/**
 * Checks whether the passed package name is installed in the project.
 *
 * @param {string} packageName The name of npm package.
 * @returns {boolean} Returns true when the package is installed or false otherwise.
 */
const isPackageInstalled = (packageName) => {
	try {
		if (require.resolve(packageName)) {
			return true;
		}
	} catch (error) {
		// do nothing
	}
	return false;
};

module.exports = isPackageInstalled;
