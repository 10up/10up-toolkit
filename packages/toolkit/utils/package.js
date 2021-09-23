/**
 * External dependencies
 */
const { realpathSync } = require('fs');
const path = require('path');
const readPkg = require('../compiled/read-pkg');
const { sync: readPkgUp } = require('../compiled/read-pkg-up');

/**
 * Internal dependencies
 */
const { getCurrentWorkingDirectory } = require('./process');

const { pkg, path: pkgPath } = readPkgUp({
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
