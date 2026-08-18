/* eslint-disable import/no-extraneous-dependencies */
import fs from 'fs';
import path from 'path';
import os from 'os';
import BuildBlocksManifestPlugin from '../build-blocks-manifest';

// Mock webpack compilation and logger
const createMockCompilation = () => {
	const logs = [];
	return {
		getLogger: () => ({
			info: (msg) => logs.push({ type: 'info', message: msg }),
			warn: (msg) => logs.push({ type: 'warn', message: msg }),
			error: (msg) => logs.push({ type: 'error', message: msg }),
		}),
		logs,
	};
};

const createMockCompiler = (onDone) => ({
	hooks: {
		done: {
			tap: (name, callback) => {
				onDone(callback);
			},
		},
	},
});

describe('BuildBlocksManifestPlugin', () => {
	let tempDir;

	beforeEach(() => {
		// Create a temporary directory for testing
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blocks-manifest-test-'));
	});

	afterEach(() => {
		// Clean up temporary directory
		if (fs.existsSync(tempDir)) {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	it('creates manifest file when blocks exist', () => {
		const blocksDir = path.join(tempDir, 'blocks');
		const exampleBlockDir = path.join(blocksDir, 'example-block');

		// Create test block structure
		fs.mkdirSync(exampleBlockDir, { recursive: true });
		fs.writeFileSync(
			path.join(exampleBlockDir, 'block.json'),
			JSON.stringify({
				name: 'test/example',
				title: 'Example Block',
				editorScript: 'file:./index.js',
			}),
		);

		const plugin = new BuildBlocksManifestPlugin({ outputPath: tempDir });
		const compilation = createMockCompilation();

		let doneCallback;
		const compiler = createMockCompiler((callback) => {
			doneCallback = callback;
		});

		plugin.apply(compiler);
		doneCallback({ compilation });

		const manifestPath = path.join(tempDir, 'blocks-manifest.php');
		expect(fs.existsSync(manifestPath)).toBeTruthy();

		const content = fs.readFileSync(manifestPath, 'utf8');
		expect(content).toContain('<?php');
		expect(content).toContain('Example Block');
		expect(content).toContain('test/example');
	});

	it('logs warning when blocks directory does not exist', () => {
		const plugin = new BuildBlocksManifestPlugin({ outputPath: tempDir });
		const compilation = createMockCompilation();

		let doneCallback;
		const compiler = createMockCompiler((callback) => {
			doneCallback = callback;
		});

		plugin.apply(compiler);
		doneCallback({ compilation });

		expect(compilation.logs.some((log) => log.type === 'warn')).toBeTruthy();
		expect(
			compilation.logs.some((log) => log.message.includes('Blocks directory not found')),
		).toBeTruthy();
	});

	it('logs warning when no block.json files found', () => {
		const blocksDir = path.join(tempDir, 'blocks');
		fs.mkdirSync(blocksDir, { recursive: true });

		const plugin = new BuildBlocksManifestPlugin({ outputPath: tempDir });
		const compilation = createMockCompilation();

		let doneCallback;
		const compiler = createMockCompiler((callback) => {
			doneCallback = callback;
		});

		plugin.apply(compiler);
		doneCallback({ compilation });

		expect(compilation.logs.some((log) => log.type === 'warn')).toBeTruthy();
		expect(
			compilation.logs.some((log) => log.message.includes('No block.json files found')),
		).toBeTruthy();
	});

	it('generates valid PHP array structure', () => {
		const blocksDir = path.join(tempDir, 'blocks');
		const block1Dir = path.join(blocksDir, 'block-one');
		const block2Dir = path.join(blocksDir, 'block-two');

		fs.mkdirSync(block1Dir, { recursive: true });
		fs.mkdirSync(block2Dir, { recursive: true });

		fs.writeFileSync(
			path.join(block1Dir, 'block.json'),
			JSON.stringify({
				name: 'test/block-one',
				title: 'Block One',
			}),
		);

		fs.writeFileSync(
			path.join(block2Dir, 'block.json'),
			JSON.stringify({
				name: 'test/block-two',
				title: 'Block Two',
			}),
		);

		const plugin = new BuildBlocksManifestPlugin({ outputPath: tempDir });
		const compilation = createMockCompilation();

		let doneCallback;
		const compiler = createMockCompiler((callback) => {
			doneCallback = callback;
		});

		plugin.apply(compiler);
		doneCallback({ compilation });

		const manifestPath = path.join(tempDir, 'blocks-manifest.php');
		const content = fs.readFileSync(manifestPath, 'utf8');

		// Check PHP structure
		expect(content).toMatch(/^<\?php/);
		expect(content).toContain('return array(');
		expect(content).toContain("'block-one' => array(");
		expect(content).toContain("'block-two' => array(");
	});

	it('handles malformed block.json gracefully', () => {
		const blocksDir = path.join(tempDir, 'blocks');
		const validBlockDir = path.join(blocksDir, 'valid-block');
		const invalidBlockDir = path.join(blocksDir, 'invalid-block');

		fs.mkdirSync(validBlockDir, { recursive: true });
		fs.mkdirSync(invalidBlockDir, { recursive: true });

		fs.writeFileSync(
			path.join(validBlockDir, 'block.json'),
			JSON.stringify({
				name: 'test/valid',
				title: 'Valid Block',
			}),
		);

		// Create invalid JSON
		fs.writeFileSync(path.join(invalidBlockDir, 'block.json'), 'invalid json {');

		const plugin = new BuildBlocksManifestPlugin({ outputPath: tempDir });
		const compilation = createMockCompilation();

		let doneCallback;
		const compiler = createMockCompiler((callback) => {
			doneCallback = callback;
		});

		plugin.apply(compiler);
		doneCallback({ compilation });

		// Should still create manifest with valid block
		const manifestPath = path.join(tempDir, 'blocks-manifest.php');
		expect(fs.existsSync(manifestPath)).toBeTruthy();

		const content = fs.readFileSync(manifestPath, 'utf8');
		expect(content).toContain('Valid Block');

		// Should log warning about invalid block
		expect(compilation.logs.some((log) => log.type === 'warn')).toBeTruthy();
	});

	it('uses directory name as block identifier', () => {
		const blocksDir = path.join(tempDir, 'blocks');
		const customNameDir = path.join(blocksDir, 'my-custom-block-name');

		fs.mkdirSync(customNameDir, { recursive: true });
		fs.writeFileSync(
			path.join(customNameDir, 'block.json'),
			JSON.stringify({
				name: 'test/example',
				title: 'Example',
			}),
		);

		const plugin = new BuildBlocksManifestPlugin({ outputPath: tempDir });
		const compilation = createMockCompilation();

		let doneCallback;
		const compiler = createMockCompiler((callback) => {
			doneCallback = callback;
		});

		plugin.apply(compiler);
		doneCallback({ compilation });

		const manifestPath = path.join(tempDir, 'blocks-manifest.php');
		const content = fs.readFileSync(manifestPath, 'utf8');

		// Should use directory name as key
		expect(content).toContain("'my-custom-block-name' => array(");
	});

	it('logs success message with block count', () => {
		const blocksDir = path.join(tempDir, 'blocks');
		const block1Dir = path.join(blocksDir, 'block-one');
		const block2Dir = path.join(blocksDir, 'block-two');

		fs.mkdirSync(block1Dir, { recursive: true });
		fs.mkdirSync(block2Dir, { recursive: true });

		fs.writeFileSync(path.join(block1Dir, 'block.json'), JSON.stringify({ name: 'test/one' }));
		fs.writeFileSync(path.join(block2Dir, 'block.json'), JSON.stringify({ name: 'test/two' }));

		const plugin = new BuildBlocksManifestPlugin({ outputPath: tempDir });
		const compilation = createMockCompilation();

		let doneCallback;
		const compiler = createMockCompiler((callback) => {
			doneCallback = callback;
		});

		plugin.apply(compiler);
		doneCallback({ compilation });

		const successLog = compilation.logs.find(
			(log) => log.type === 'info' && log.message.includes('2 blocks'),
		);
		expect(successLog).toBeTruthy();
	});

	it('allows custom output filename', () => {
		const blocksDir = path.join(tempDir, 'blocks');
		const exampleBlockDir = path.join(blocksDir, 'example');

		fs.mkdirSync(exampleBlockDir, { recursive: true });
		fs.writeFileSync(
			path.join(exampleBlockDir, 'block.json'),
			JSON.stringify({ name: 'test/example' }),
		);

		const plugin = new BuildBlocksManifestPlugin({
			outputPath: tempDir,
			outputFile: 'custom-manifest.php',
		});
		const compilation = createMockCompilation();

		let doneCallback;
		const compiler = createMockCompiler((callback) => {
			doneCallback = callback;
		});

		plugin.apply(compiler);
		doneCallback({ compilation });

		const manifestPath = path.join(tempDir, 'custom-manifest.php');
		expect(fs.existsSync(manifestPath)).toBeTruthy();
	});
});
