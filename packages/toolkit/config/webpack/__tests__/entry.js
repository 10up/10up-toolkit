// Mock fs and fast-glob for testing
jest.mock('fs', () => ({
	readFileSync: jest.fn(),
}));

jest.mock('fast-glob', () => ({
	sync: jest.fn(),
}));

const { readFileSync } = require('fs');
const { sync: glob } = require('fast-glob');
const entry = require('../entry');

describe('entry module function', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Mock process.cwd to return a consistent path for testing
		jest.spyOn(process, 'cwd').mockReturnValue('/mock/project/root');
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

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

	describe('project mode with useBlockAssets', () => {
		it('handles block assets with leading slashes in entry names', () => {
			const mockBlockMetadata = JSON.stringify({
				editorScript: ['file:./editor.js'],
				script: ['file:./script.js'],
				style: ['file:./style.css'],
			});

			readFileSync.mockReturnValue(mockBlockMetadata);
			glob.mockReturnValueOnce(['/mock/project/root/includes/blocks/example/block.json']) // block.json files
				.mockReturnValueOnce(['/mock/project/root/includes/blocks/example/editor.js']) // editor.js
				.mockReturnValueOnce(['/mock/project/root/includes/blocks/example/script.js']) // script.js
				.mockReturnValueOnce(['/mock/project/root/includes/blocks/example/style.css']); // style.css

			const result = entry({
				buildType: 'script',
				isPackage: false,
				projectConfig: {
					paths: { blocksDir: './includes/blocks' },
					useBlockAssets: true,
					filenames: {},
				},
				packageConfig: {},
				buildFiles: { existing: 'existing.js' },
				moduleBuildFiles: {},
			});

			expect(result).toEqual({
				existing: 'existing.js',
				'example/editor': '/mock/project/root/includes/blocks/example/editor.js',
				'example/script': '/mock/project/root/includes/blocks/example/script.js',
				'example/style': '/mock/project/root/includes/blocks/example/style.css',
			});
		});

		it('handles Windows-style paths correctly', () => {
			const mockBlockMetadata = JSON.stringify({
				editorScript: ['file:./editor.js'],
			});

			readFileSync.mockReturnValue(mockBlockMetadata);
			glob.mockReturnValueOnce([
				'C:\\mock\\project\\root\\includes\\blocks\\example\\block.json',
			]) // Windows path
				.mockReturnValueOnce([
					'C:\\mock\\project\\root\\includes\\blocks\\example\\editor.js',
				]); // Windows path

			const result = entry({
				buildType: 'script',
				isPackage: false,
				projectConfig: {
					paths: { blocksDir: './includes/blocks' },
					useBlockAssets: true,
					filenames: {},
				},
				packageConfig: {},
				buildFiles: {},
				moduleBuildFiles: {},
			});

			expect(result).toEqual({
				editor: 'C:\\mock\\project\\root\\includes\\blocks\\example\\editor.js',
			});
		});

		it('handles nested block directories with leading slashes', () => {
			const mockBlockMetadata = JSON.stringify({
				editorScript: ['file:./editor.js'],
			});

			readFileSync.mockReturnValue(mockBlockMetadata);
			glob.mockReturnValueOnce([
				'/mock/project/root/includes/blocks/nested/deep/block.json',
			]).mockReturnValueOnce(['/mock/project/root/includes/blocks/nested/deep/editor.js']);

			const result = entry({
				buildType: 'script',
				isPackage: false,
				projectConfig: {
					paths: { blocksDir: './includes/blocks' },
					useBlockAssets: true,
					filenames: {},
				},
				packageConfig: {},
				buildFiles: {},
				moduleBuildFiles: {},
			});

			expect(result).toEqual({
				'nested/deep/editor': '/mock/project/root/includes/blocks/nested/deep/editor.js',
			});
		});

		it('handles absolute paths in block.json file references', () => {
			const mockBlockMetadata = JSON.stringify({
				editorScript: ['file:/absolute/path/editor.js'],
			});

			readFileSync.mockReturnValue(mockBlockMetadata);
			glob.mockReturnValueOnce([
				'/mock/project/root/includes/blocks/example/block.json',
			]).mockReturnValueOnce(['/absolute/path/editor.js']);

			const result = entry({
				buildType: 'script',
				isPackage: false,
				projectConfig: {
					paths: { blocksDir: './includes/blocks' },
					useBlockAssets: true,
					filenames: {},
				},
				packageConfig: {},
				buildFiles: {},
				moduleBuildFiles: {},
			});

			expect(result).toEqual({
				'example/absolute/path/editor': '/absolute/path/editor.js',
			});
		});

		it('handles module build type correctly', () => {
			const mockBlockMetadata = JSON.stringify({
				scriptModule: ['file:./module.js'],
				viewScriptModule: ['file:./view-module.js'],
			});

			readFileSync.mockReturnValue(mockBlockMetadata);
			glob.mockReturnValueOnce(['/mock/project/root/includes/blocks/example/block.json'])
				.mockReturnValueOnce(['/mock/project/root/includes/blocks/example/module.js'])
				.mockReturnValueOnce(['/mock/project/root/includes/blocks/example/view-module.js']);

			const result = entry({
				buildType: 'module',
				isPackage: false,
				projectConfig: {
					paths: { blocksDir: './includes/blocks' },
					useBlockAssets: true,
					filenames: {},
				},
				packageConfig: {},
				buildFiles: {},
				moduleBuildFiles: { existing: 'existing.js' },
			});

			expect(result).toEqual({
				existing: 'existing.js',
				'example/module': '/mock/project/root/includes/blocks/example/module.js',
				'example/view-module': '/mock/project/root/includes/blocks/example/view-module.js',
			});
		});

		it('handles malformed block.json gracefully', () => {
			readFileSync.mockImplementation(() => {
				throw new Error('Invalid JSON');
			});
			glob.mockReturnValueOnce(['/mock/project/root/includes/blocks/example/block.json']);

			const result = entry({
				buildType: 'script',
				isPackage: false,
				projectConfig: {
					paths: { blocksDir: './includes/blocks' },
					useBlockAssets: true,
					filenames: {},
				},
				packageConfig: {},
				buildFiles: { existing: 'existing.js' },
				moduleBuildFiles: {},
			});

			expect(result).toEqual({
				existing: 'existing.js',
			});
		});

		it('filters out non-file assets correctly', () => {
			const mockBlockMetadata = JSON.stringify({
				editorScript: ['file:./editor.js', 'wp-blocks'], // wp-blocks is a handle, not a file
				script: ['file:./script.js'],
			});

			readFileSync.mockReturnValue(mockBlockMetadata);
			glob.mockReturnValueOnce(['/mock/project/root/includes/blocks/example/block.json'])
				.mockReturnValueOnce(['/mock/project/root/includes/blocks/example/editor.js'])
				.mockReturnValueOnce(['/mock/project/root/includes/blocks/example/script.js']);

			const result = entry({
				buildType: 'script',
				isPackage: false,
				projectConfig: {
					paths: { blocksDir: './includes/blocks' },
					useBlockAssets: true,
					filenames: {},
				},
				packageConfig: {},
				buildFiles: {},
				moduleBuildFiles: {},
			});

			expect(result).toEqual({
				'example/editor': '/mock/project/root/includes/blocks/example/editor.js',
				'example/script': '/mock/project/root/includes/blocks/example/script.js',
			});
		});
	});

	describe('project mode with loadBlockSpecificStyles', () => {
		it('handles block-specific styles with leading slashes', () => {
			glob.mockReturnValueOnce([
				'/mock/project/root/assets/css/blocks/example/style.css',
				'/mock/project/root/assets/css/blocks/nested/block/style.scss',
			]);

			const result = entry({
				buildType: 'script',
				isPackage: false,
				projectConfig: {
					paths: { blocksStyles: './assets/css/blocks' },
					loadBlockSpecificStyles: true,
				},
				packageConfig: {},
				buildFiles: { existing: 'existing.js' },
				moduleBuildFiles: {},
			});

			expect(result).toEqual({
				existing: 'existing.js',
				'autoenqueue/example/style':
					'/mock/project/root/assets/css/blocks/example/style.css',
				'autoenqueue/nested/block/style':
					'/mock/project/root/assets/css/blocks/nested/block/style.scss',
			});
		});

		it('handles nested block style directories correctly', () => {
			glob.mockReturnValueOnce([
				'/mock/project/root/assets/css/blocks/deeply/nested/block/style.css',
			]);

			const result = entry({
				buildType: 'script',
				isPackage: false,
				projectConfig: {
					paths: { blocksStyles: './assets/css/blocks' },
					loadBlockSpecificStyles: true,
				},
				packageConfig: {},
				buildFiles: {},
				moduleBuildFiles: {},
			});

			expect(result).toEqual({
				'autoenqueue/deeply/nested/block/style':
					'/mock/project/root/assets/css/blocks/deeply/nested/block/style.css',
			});
		});
	});

	describe('project mode with both useBlockAssets and loadBlockSpecificStyles', () => {
		it('combines both block assets and block styles correctly', () => {
			const mockBlockMetadata = JSON.stringify({
				editorScript: ['file:./editor.js'],
			});

			readFileSync.mockReturnValue(mockBlockMetadata);
			glob.mockReturnValueOnce(['/mock/project/root/includes/blocks/example/block.json']) // block.json
				.mockReturnValueOnce(['/mock/project/root/includes/blocks/example/editor.js']) // editor.js
				.mockReturnValueOnce(['/mock/project/root/assets/css/blocks/example/style.css']); // block style

			const result = entry({
				buildType: 'script',
				isPackage: false,
				projectConfig: {
					paths: {
						blocksDir: './includes/blocks',
						blocksStyles: './assets/css/blocks',
					},
					useBlockAssets: true,
					loadBlockSpecificStyles: true,
					filenames: {},
				},
				packageConfig: {},
				buildFiles: { existing: 'existing.js' },
				moduleBuildFiles: {},
			});

			expect(result).toEqual({
				existing: 'existing.js',
				'example/editor': '/mock/project/root/includes/blocks/example/editor.js',
				'autoenqueue/example/style':
					'/mock/project/root/assets/css/blocks/example/style.css',
			});
		});
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
