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

let pkg;
let pkgPath;
const packageData = readPkgUp.sync({
	cwd: realpathSync(getCurrentWorkingDirectory()),
});

if (packageData && packageData.packageJson && packageData.path) {
	pkg = packageData.packageJson;
	pkgPath = packageData.path;
}

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
 * Returns the version of an installed npm package by name.
 * Resolves the package's package.json so it works without importing the package.
 * Uses read-pkg to read and parse the package.json.
 *
 * @param {string} packageName - The name of the npm package (e.g. 'webpack-dev-server').
 * @param {string} [fallback='0'] - Value to return if the package is not installed or version is unreadable.
 * @returns {string} The package version string or the fallback.
 */
const getInstalledPackageVersion = (packageName, fallback = '0') => {
	try {
		const pkgPath = require.resolve(`${packageName}/package.json`);
		const pkg = readPkg.sync({ cwd: path.dirname(pkgPath) });
		return typeof pkg.version === 'string' ? pkg.version : fallback;
	} catch {
		return fallback;
	}
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

/**
 * Compares two semver-like version strings (e.g. "5.2.2", "1.0.0-beta.1").
 * Only the numeric segments are compared; non-numeric segments are treated as 0.
 *
 * @param {string} actual - The resolved version (e.g. from a package).
 * @param {string} min   - The minimum required version.
 * @returns {boolean} True if actual >= min, false otherwise.
 */
const isMinimumPackageVersion = (actual, min) => {
	const actualVersions = actual.split('.').map(Number);
	const minimumVersions = min.split('.').map(Number);

	for (let i = 0; i < Math.max(actualVersions.length, minimumVersions.length); i++) {
		const actualVersionLevel = actualVersions[i] || 0;
		const minimumVersionLevel = minimumVersions[i] || 0;
		if (actualVersionLevel > minimumVersionLevel) {
			return true;
		}
		if (actualVersionLevel < minimumVersionLevel) {
			return false;
		}
	}

	return true;
};

module.exports = {
	getInstalledPackageVersion,
	getPackage,
	getPackagePath,
	getPackageVersion,
	hasPackageProp,
	isMinimumPackageVersion,
	isPackageInstalled,
};
