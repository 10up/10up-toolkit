/**
 * External dependencies
 */
const { realpathSync } = require('fs');
const path = require('path');
const readPkgUp = require('read-pkg-up');
const readPkg = require('read-pkg');

/**
 * Internal dependencies
 */
const { getCurrentWorkingDirectory } = require('./process');

const { packageJson: pkg, path: pkgPath } = readPkgUp.sync({
	cwd: realpathSync(getCurrentWorkingDirectory()),
});

const getPackage = () => pkg;

const getPackagePath = () => pkgPath;

const hasPackageProp = (prop) => pkg && Object.prototype.hasOwnProperty.call(pkg, prop);

/**
 * Returns the 10up scripts version directly from package.json
 *
 * @returns {number}
 */
const getPackageVersion = async () => {
	const pkg = await readPkg({ cwd: path.dirname(__dirname) });
	return pkg.version;
};

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

module.exports = {
	isPackageInstalled,
	getPackagePath,
	hasPackageProp,
	getPackage,
	getPackageVersion,
};
