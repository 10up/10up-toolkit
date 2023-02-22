const { readFileSync } = require('fs');
const { dirname, extname, join, resolve } = require('path');
const { sync: glob } = require('fast-glob');

const removeDistFolder = (file) => {
	return file.replace(/(^\.\/dist\/)|^dist\//, '');
};

module.exports = ({
	isPackage,
	projectConfig: { devServer, paths, useBlockAssets, filenames },
	packageConfig: { packageType, source, main, umd, libraryName },
	buildFiles,
}) => {
	let additionalEntrypoints = {};
	if (useBlockAssets) {
		// override default block filenames
		filenames.block = 'blocks/[name].js';
		filenames.blockCSS = 'blocks/[name].css';

		const blocksSourceDirectory = resolve(process.cwd(), paths.blocksDir);

		// get all block.json files in the blocks directory
		const blockMetadataFiles = glob(
			// glob only accepts forward-slashes this is required to make things work on Windows
			`${blocksSourceDirectory.replace(/\\/g, '/')}/**/block.json`,
			{
				absolute: true,
			},
		);

		// add any additional entrypoints we find in block.json filed to the webpack config
		additionalEntrypoints = blockMetadataFiles.reduce((accumulator, blockMetadataFile) => {
			// wrapping in try/catch in case the file is malformed
			// this happens especially when new block.json files are added
			// at which point they are completely empty and therefore not valid JSON
			try {
				// get all assets from the block.json file
				const { editorScript, script, viewScript, style, editorStyle } = JSON.parse(
					readFileSync(blockMetadataFile),
				);

				// generate a new entrypoint for each of the assets
				[editorScript, script, viewScript, style, editorStyle]
					.flat()
					.filter((rawFilepath) => rawFilepath && rawFilepath.startsWith('file:')) // assets can be files or handles. we only want files
					.forEach((rawFilepath) => {
						// Removes the `file:` prefix.
						const filepath = join(
							dirname(blockMetadataFile),
							rawFilepath.replace('file:', ''),
						);

						// get the entrypoint name from the filepath by removing the blocks source directory and the file extension
						const entryName = filepath
							.replace(extname(filepath), '')
							.replace(blocksSourceDirectory, '')
							.replace(/\\/g, '/');

						// Detects the proper file extension used in the defined source directory.
						const [entryFilepath] = glob(
							// glob only accepts forward-slashes this is required to make things work on Windows
							`${blocksSourceDirectory.replace(
								/\\/g,
								'/',
							)}/${entryName}.([jt]s?(x)|?(s)css)`,
							{
								absolute: true,
							},
						);

						if (!entryFilepath) {
							// eslint-disable-next-line no-console
							console.warn('There was no entry file found for', entryName);
							return;
						}

						accumulator[entryName] = entryFilepath;
					});
				return accumulator;
			} catch (error) {
				return accumulator;
			}
		}, {});
	}

	// merge the new entrypoints with the existing ones
	Object.assign(buildFiles, additionalEntrypoints);

	if (isPackage) {
		const config = {};
		const hasBuildFiles = Object.keys(buildFiles).length > 0;

		if (hasBuildFiles) {
			return buildFiles;
		}

		if (packageType !== 'umd') {
			config.main = {
				import: `./${source}`,
				filename: removeDistFolder(main),
			};

			if (typeof packageType === 'undefined' || packageType !== 'none') {
				config.main.library = {
					type: ['commonjs2', 'commonjs', 'all'].includes(packageType)
						? 'commonjs2'
						: packageType,
				};
			}
		}

		if (umd && !devServer) {
			config.umd = {
				filename: removeDistFolder(umd),
				import: `./${source}`,
			};

			if (typeof packageType === 'undefined' || packageType !== 'none') {
				config.umd.library = { name: libraryName, type: 'umd' };
			}
		}

		return config;
	}

	return buildFiles;
};
