const path = require('path');
const { getFileContentHash } = require('./file');

const maybeInsertStyleVersionHash = (content, absoluteFilename) => {
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

	return JSON.stringify(
		{
			...metadata,
			version: styleFileContentHash,
		},
		null,
		2,
	);
};

module.exports = { maybeInsertStyleVersionHash };
