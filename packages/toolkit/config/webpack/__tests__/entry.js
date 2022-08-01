const entry = require('../entry');

describe('entry module function', () => {
	it('returns project mode entry config', () => {
		const buildFiles = { entry: 'entry.js' };
		expect(
			entry({
				isPackage: false,
				packageConfig: {},
				projectConfig: { paths: { blocksDir: './includes2/blocks/' } },
				buildFiles,
			}),
		).toEqual(buildFiles);
	});

	it('returns package mode entry config', () => {
		const buildFiles = { entry: 'entry.js' };
		expect(
			entry({
				isPackage: true,
				packageConfig: {},
				projectConfig: { paths: { blocksDir: './includes2/blocks/' } },
				buildFiles,
			}),
		).toEqual(buildFiles);

		expect(
			entry({
				isPackage: true,
				packageConfig: {
					packageType: 'all',
					source: 'src/index.js',
					main: 'index.js',
					umd: 'index.umd.js',
					libraryName: 'LibraryName',
				},
				projectConfig: { paths: { blocksDir: './includes2/blocks/' } },
				buildFiles: [],
			}),
		).toEqual({
			main: {
				import: './src/index.js',
				filename: 'index.js',
				library: {
					type: 'commonjs2',
				},
			},
			umd: {
				filename: 'index.umd.js',
				import: './src/index.js',
				library: {
					name: 'LibraryName',
					type: 'umd',
				},
			},
		});

		expect(
			entry({
				isPackage: true,
				packageConfig: {
					packageType: 'commonjs2',
					source: 'src/index.js',
					main: 'index.js',
					libraryName: 'LibraryName',
				},
				projectConfig: { paths: { blocksDir: './includes2/blocks/' } },
				buildFiles: [],
			}),
		).toEqual({
			main: {
				import: './src/index.js',
				filename: 'index.js',
				library: {
					type: 'commonjs2',
				},
			},
		});

		expect(
			entry({
				isPackage: true,
				packageConfig: {
					packageType: 'module',
					source: 'src/index.js',
					main: 'index.js',
					libraryName: 'LibraryName',
				},
				projectConfig: { paths: { blocksDir: './includes2/blocks/' } },
				buildFiles: [],
			}),
		).toEqual({
			main: {
				import: './src/index.js',
				filename: 'index.js',
				library: {
					type: 'module',
				},
			},
		});
	});
});
