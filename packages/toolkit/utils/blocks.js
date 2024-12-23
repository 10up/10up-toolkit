const path = require('path');
const { getFileContentHash } = require('./file');

const JS_ASSET_KEYS = ['script', 'editorScript', 'viewScript', 'viewScriptModule', 'scriptModule'];
const CSS_ASSET_KEYS = ['style', 'editorStyle', 'viewStyle'];

/**
 * Transform the asset path from `.ts or .tsx` to `.js`
 *
 * When a block.json file has a script property that points to a `.ts or .tsx` file,
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

/**
 * Transform the asset path from `.sass or .scss` to `.css`
 *
 * When a block.json file has a style property that points to a `.sass or .scss` file,
 * this function will transform the path to point to the `.css` file instead.
 *
 * @param {string|Array<string>} asset - The asset path to transform
 * @returns {string|Array<string>}
 */
function transformSassAsset(asset) {
	function replaceExtension(filePath) {
		const isFilePath = filePath.startsWith('file:');
		if (!isFilePath) {
			return filePath;
		}

		// replace the `.sass or .scss` extension with `.css`
		const cssPath = filePath.replace(/\.s[ac]ss$/, '.css');
		return cssPath;
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

	JS_ASSET_KEYS.forEach((key) => {
		if (metadata[key]) {
			newMetadata[key] = transformTSAsset(metadata[key]);
		}
	});

	CSS_ASSET_KEYS.forEach((key) => {
		if (metadata[key]) {
			newMetadata[key] = transformSassAsset(metadata[key]);
		}
	});

	return JSON.stringify(newMetadata, null, 2);
};

module.exports = { transformBlockJson };
