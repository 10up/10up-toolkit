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

module.exports = {
	getPackagePath,
	hasPackageProp,
	getPackage,
	getPackageVersion,
};
