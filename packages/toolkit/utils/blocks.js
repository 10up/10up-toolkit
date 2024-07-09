const path = require('path');
const { getFileContentHash } = require('./file');

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

	if (hasVersion || !isFilePath) {
		return content;
	}

	const absoluteDirectory = absoluteFilename.replace(/block\.json$/, '');

	let styleFileContentHash = '';

	styleArray.forEach((rawStylePath) => {
		if (!rawStylePath.startsWith('file:')) {
			return;
		}
		const stylePath = rawStylePath.replace('file:', '');
		const absoluteStylePath = path.join(absoluteDirectory, stylePath);
		styleFileContentHash += getFileContentHash(absoluteStylePath);
	});

	const { script, editorScript, viewScript, viewScriptModule, scriptModule } = metadata;

	const jsAssets = [script, editorScript, viewScript, viewScriptModule, scriptModule].filter(
		Boolean,
	);

	const transformedJsAssets = jsAssets.map((asset) => {
		const assetArray = Array.isArray(asset) ? asset : [asset];

		return assetArray.map((rawJsPath) => {
			if (!rawJsPath.startsWith('file:')) {
				return rawJsPath;
			}
			const isFilePath = rawJsPath.startsWith('file:');
			if (!isFilePath) {
				return rawJsPath;
			}

			// replace the `.ts or .tsx` extension with `.js`
			const jsPath = rawJsPath.replace(/\.tsx?$/, '.js');
			return jsPath;
		});
	});

	return JSON.stringify(
		{
			...metadata,
			version: styleFileContentHash,
			...transformedJsAssets,
		},
		null,
		2,
	);
};

module.exports = { transformBlockJson };
