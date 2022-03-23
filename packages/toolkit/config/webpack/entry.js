const { existsSync } = require('fs');
const { basename } = require('path');

const removeDistFolder = (file) => {
	return file.replace(/(^\.\/dist\/)|^dist\//, '');
};

const resolveFile = (entry) => {
	let sourceFileName = false;
	try {
		// try to resolve the module from within the project location
		sourceFileName = require.resolve(entry, { paths: [process.cwd()] });
	} catch (e) {
		// if it can't find, let's try to find .ts files through a simple module resolution
		if (existsSync(`${process.cwd()}/${entry}.ts`)) {
			sourceFileName = `${process.cwd()}/${entry}.ts`;
		} else if (existsSync(`${process.cwd()}/${entry}/index.ts`)) {
			sourceFileName = `${process.cwd()}/${entry}/index.ts`;
		}
	}

	return sourceFileName;
};
module.exports = ({
	isPackage,
	projectConfig: { devServer },
	packageConfig: { packageType, source, main, umd, libraryName, exports },
	buildFiles,
}) => {
	if (isPackage) {
		const config = {};
		const hasExportsField = Object.keys(exports).length > 0;

		if (hasExportsField) {
			const exportsKeys = Object.keys(exports);
			exportsKeys.forEach((entry) => {
				const destination = exports[entry];

				// we only support the trivial exports sintax
				if (typeof destination === 'string') {
					if (['.', '*'].includes(entry)) {
						config.main = {
							import: `./${source}`,
							filename: removeDistFolder(destination),
							library: {
								type: 'commonjs2',
							},
						};
					} else {
						const entryPointsName = basename(entry);

						const sourceFileName = resolveFile(entry);
						config[entryPointsName] = {
							import: `${sourceFileName}`,
							filename: removeDistFolder(destination),
							library: {
								type: 'commonjs2',
							},
						};
					}
				}
			});

			return config;
		}

		if (['commonjs2', 'commonjs', 'all'].includes(packageType)) {
			config.main = {
				import: `./${source}`,
				filename: removeDistFolder(main),
				library: {
					type: 'commonjs2',
				},
			};
		}

		if (umd && !devServer) {
			config.umd = {
				filename: removeDistFolder(umd),
				import: `./${source}`,
				library: { name: libraryName, type: 'umd' },
			};
		}

		return config;
	}

	return buildFiles;
};
