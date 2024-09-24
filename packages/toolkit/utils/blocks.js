const path = require('path');
const { getFileContentHash } = require('./file');

/**
 * Transform the asset path from `.ts or .tsx` to `.js`
 *
 * When a block.json file has a script or style property that points to a `.ts or .tsx` file,
 * this function will transform the path to point to the `.js` file instead.
 *
 * @param {string|Array<string>} asset - The asset path to transform
 * @returns {string|Array<string>}
 */
function transformTSAsset(asset) {
	function replaceExtension(filePath) {
		const isFilePath = filePath.startsWith('file:');
		if (!isFilePath) {
			return filePath;
		}

		// replace the `.ts or .tsx` extension with `.js`
		const jsPath = filePath.replace(/\.tsx?$/, '.js');
		return jsPath;
	}

	return Array.isArray(asset) ? asset.map(replaceExtension) : replaceExtension(asset);
}

const transformBlockJson = (content, absoluteFilename) => {
	const rawMetadata = content.toString();
	if (rawMetadata === '') {
		return content;
	}
	const metadata = JSON.parse(rawMetadata);
	const { version, style } = metadata;

	const styleArray = Array.isArray(style) ? style : [style];

	// check whether the style property is defined and a local file path
	const isFilePath = styleArray?.some((styleName) => styleName?.startsWith('file:'));
	const hasVersion = version !== undefined;

	const absoluteDirectory = absoluteFilename.replace(/block\.json$/, '');

	let styleFileContentHash = '';

	if (!hasVersion && isFilePath) {
		styleArray.forEach((rawStylePath) => {
			if (!rawStylePath.startsWith('file:')) {
				return;
			}
			const stylePath = rawStylePath.replace('file:', '');
			const absoluteStylePath = path.join(absoluteDirectory, stylePath);
			styleFileContentHash += getFileContentHash(absoluteStylePath);
		});
	}

	const newMetadata = {
		...metadata,
	};

	if (!hasVersion && styleFileContentHash) {
		newMetadata.version = styleFileContentHash;
	}

	if (metadata.script) {
		newMetadata.script = transformTSAsset(metadata.script);
	}

	if (metadata.editorScript) {
		newMetadata.editorScript = transformTSAsset(metadata.editorScript);
	}

	if (metadata.viewScript) {
		newMetadata.viewScript = transformTSAsset(metadata.viewScript);
	}

	if (metadata.viewScriptModule) {
		newMetadata.viewScriptModule = transformTSAsset(metadata.viewScriptModule);
	}

	if (metadata.scriptModule) {
		newMetadata.scriptModule = transformTSAsset(metadata.scriptModule);
	}

	return JSON.stringify(newMetadata, null, 2);
};

module.exports = { transformBlockJson };
