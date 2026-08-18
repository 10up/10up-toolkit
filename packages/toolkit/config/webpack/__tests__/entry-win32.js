/**
 * Windows path handling for block entrypoints.
 *
 * The entry module mixes two path flavours on Windows: `fast-glob` always returns
 * forward slashes, while `path.resolve`/`path.join` return drive-qualified, backslash
 * separated paths. Getting the entry name out of that means the two have to line up.
 *
 * Rather than rely on CI actually running on Windows to cover this, `path` is swapped
 * for `path.win32` so these assertions exercise Windows semantics on every platform.
 */

jest.mock('fs', () => ({ readFileSync: jest.fn() }));
jest.mock('fast-glob', () => ({ sync: jest.fn() }));
jest.mock('path', () => jest.requireActual('path').win32);

const { readFileSync } = require('fs');
const { sync: glob } = require('fast-glob');
const entry = require('../entry');

// A realistic Windows project root, matching what `process.cwd()` returns there.
const WIN_ROOT = 'C:\\mock\\project\\root';

const buildEntry = (overrides = {}) =>
	entry({
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
		...overrides,
	});

describe('entry module function on Windows', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(process, 'cwd').mockReturnValue(WIN_ROOT);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('derives entry names relative to the blocks directory', () => {
		readFileSync.mockReturnValue(JSON.stringify({ editorScript: ['file:./editor.js'] }));
		// fast-glob returns forward slashes even on Windows.
		glob.mockReturnValueOnce([
			'C:/mock/project/root/includes/blocks/example/block.json',
		]).mockReturnValueOnce(['C:/mock/project/root/includes/blocks/example/editor.js']);

		expect(buildEntry()).toEqual({
			'example/editor': 'C:/mock/project/root/includes/blocks/example/editor.js',
		});
	});

	it('does not leak the drive letter or absolute path into the entry name', () => {
		readFileSync.mockReturnValue(JSON.stringify({ editorScript: ['file:./editor.js'] }));
		glob.mockReturnValueOnce([
			'C:/mock/project/root/includes/blocks/example/block.json',
		]).mockReturnValueOnce(['C:/mock/project/root/includes/blocks/example/editor.js']);

		const [entryName] = Object.keys(buildEntry());

		expect(entryName).not.toMatch(/^[a-zA-Z]:/);
		expect(entryName).not.toContain('\\');
		expect(entryName).not.toMatch(/^\//);
	});

	it('handles nested block directories', () => {
		readFileSync.mockReturnValue(JSON.stringify({ editorScript: ['file:./editor.js'] }));
		glob.mockReturnValueOnce([
			'C:/mock/project/root/includes/blocks/nested/deep/block.json',
		]).mockReturnValueOnce(['C:/mock/project/root/includes/blocks/nested/deep/editor.js']);

		expect(buildEntry()).toEqual({
			'nested/deep/editor': 'C:/mock/project/root/includes/blocks/nested/deep/editor.js',
		});
	});

	// Style entrypoints are passed through `path.resolve`, so the emitted value uses native
	// separators, while the entry name itself stays forward-slashed.
	it('handles block-specific styles', () => {
		glob.mockReturnValueOnce([
			'C:/mock/project/root/assets/css/blocks/example/style.css',
			'C:/mock/project/root/assets/css/blocks/nested/block/style.scss',
		]);

		expect(
			buildEntry({
				projectConfig: {
					paths: { blocksStyles: './assets/css/blocks' },
					loadBlockSpecificStyles: true,
				},
			}),
		).toEqual({
			'autoenqueue/example/style':
				'C:\\mock\\project\\root\\assets\\css\\blocks\\example\\style.css',
			'autoenqueue/nested/block/style':
				'C:\\mock\\project\\root\\assets\\css\\blocks\\nested\\block\\style.scss',
		});
	});
});
