/**
 * External dependencies
 */
const { existsSync, readdirSync, readFileSync } = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Internal dependencies
 */
const { getPackagePath } = require('./package');

const fromProjectRoot = (fileName) => path.join(path.dirname(getPackagePath()), fileName);

const hasProjectFile = (fileName) => existsSync(fromProjectRoot(fileName));

const fromConfigRoot = (fileName) => path.join(path.dirname(__dirname), 'config', fileName);

const fromScriptsRoot = (scriptName) =>
	path.join(path.dirname(__dirname), 'scripts', `${scriptName}.js`);

const hasScriptFile = (scriptName) => existsSync(fromScriptsRoot(scriptName));

const getScripts = () =>
	readdirSync(path.join(path.dirname(__dirname), 'scripts'))
		.filter((f) => path.extname(f) === '.js')
		.map((f) => path.basename(f, '.js'));

const getFileContentHash = (filePath) => {
	const fileBuffer = readFileSync(filePath);
	const hashSum = crypto.createHash('sha256');
	hashSum.update(fileBuffer);
	return hashSum.digest('hex');
};

module.exports = {
	fromProjectRoot,
	fromConfigRoot,
	fromScriptsRoot,
	getScripts,
	hasProjectFile,
	hasScriptFile,
	getFileContentHash,
};
