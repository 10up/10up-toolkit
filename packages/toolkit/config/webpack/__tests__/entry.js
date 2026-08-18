// Mock fs and fast-glob for testing
jest.mock('fs', () => ({
	readFileSync: jest.fn(),
}));

jest.mock('fast-glob', () => ({
	sync: jest.fn(),
}));

const { readFileSync } = require('fs');
const { sync: glob } = require('fast-glob');
const { join, resolve } = require('path');
const entry = require('../entry');

// The module under test derives the blocks directory with `path.resolve`, which is
// platform-native: on Windows it produces a drive-qualified, backslash-separated path.
// Anchoring the fixtures to the same `resolve` call keeps the mocked filesystem
// self-consistent on every platform, rather than describing a POSIX-only one that
// Windows can never match. See `entry-win32.js` for Windows-specific behaviour.
const ROOT = resolve('/mock/project/root');

// Builds an absolute path below ROOT in the shape fast-glob returns: fast-glob always
// emits forward slashes, even on Windows.
const p = (relativePath) => join(ROOT, relativePath).replace(/\\/g, '/');

describe('entry module function', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Mock process.cwd to return a consistent path for testing
		jest.spyOn(process, 'cwd').mockReturnValue(ROOT);
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
			glob.mockReturnValueOnce([p('includes/blocks/example/block.json')]) // block.json files
				.mockReturnValueOnce([p('includes/blocks/example/editor.js')]) // editor.js
				.mockReturnValueOnce([p('includes/blocks/example/script.js')]) // script.js
				.mockReturnValueOnce([p('includes/blocks/example/style.css')]); // style.css

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
				'example/editor': p('includes/blocks/example/editor.js'),
				'example/script': p('includes/blocks/example/script.js'),
				'example/style': p('includes/blocks/example/style.css'),
			});
		});

		it('handles nested block directories with leading slashes', () => {
			const mockBlockMetadata = JSON.stringify({
				editorScript: ['file:./editor.js'],
			});

			readFileSync.mockReturnValue(mockBlockMetadata);
			glob.mockReturnValueOnce([
				p('includes/blocks/nested/deep/block.json'),
			]).mockReturnValueOnce([p('includes/blocks/nested/deep/editor.js')]);

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
				'nested/deep/editor': p('includes/blocks/nested/deep/editor.js'),
			});
		});

		it('handles absolute paths in block.json file references', () => {
			const mockBlockMetadata = JSON.stringify({
				editorScript: ['file:/absolute/path/editor.js'],
			});

			readFileSync.mockReturnValue(mockBlockMetadata);
			glob.mockReturnValueOnce([p('includes/blocks/example/block.json')]).mockReturnValueOnce(
				['/absolute/path/editor.js'],
			);

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
			glob.mockReturnValueOnce([p('includes/blocks/example/block.json')])
				.mockReturnValueOnce([p('includes/blocks/example/module.js')])
				.mockReturnValueOnce([p('includes/blocks/example/view-module.js')]);

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
				'example/module': p('includes/blocks/example/module.js'),
				'example/view-module': p('includes/blocks/example/view-module.js'),
			});
		});

		it('handles malformed block.json gracefully', () => {
			readFileSync.mockImplementation(() => {
				throw new Error('Invalid JSON');
			});
			glob.mockReturnValueOnce([p('includes/blocks/example/block.json')]);

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
			glob.mockReturnValueOnce([p('includes/blocks/example/block.json')])
				.mockReturnValueOnce([p('includes/blocks/example/editor.js')])
				.mockReturnValueOnce([p('includes/blocks/example/script.js')]);

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
				'example/editor': p('includes/blocks/example/editor.js'),
				'example/script': p('includes/blocks/example/script.js'),
			});
		});
	});

	describe('project mode with loadBlockSpecificStyles', () => {
		it('handles block-specific styles with leading slashes', () => {
			glob.mockReturnValueOnce([
				p('assets/css/blocks/example/style.css'),
				p('assets/css/blocks/nested/block/style.scss'),
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
				'autoenqueue/example/style': p('assets/css/blocks/example/style.css'),
				'autoenqueue/nested/block/style': p('assets/css/blocks/nested/block/style.scss'),
			});
		});

		it('handles nested block style directories correctly', () => {
			glob.mockReturnValueOnce([p('assets/css/blocks/deeply/nested/block/style.css')]);

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
				'autoenqueue/deeply/nested/block/style': p(
					'assets/css/blocks/deeply/nested/block/style.css',
				),
			});
		});
	});

	describe('project mode with both useBlockAssets and loadBlockSpecificStyles', () => {
		it('combines both block assets and block styles correctly', () => {
			const mockBlockMetadata = JSON.stringify({
				editorScript: ['file:./editor.js'],
			});

			readFileSync.mockReturnValue(mockBlockMetadata);
			glob.mockReturnValueOnce([p('includes/blocks/example/block.json')]) // block.json
				.mockReturnValueOnce([p('includes/blocks/example/editor.js')]) // editor.js
				.mockReturnValueOnce([p('assets/css/blocks/example/style.css')]); // block style

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
				'example/editor': p('includes/blocks/example/editor.js'),
				'autoenqueue/example/style': p('assets/css/blocks/example/style.css'),
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
