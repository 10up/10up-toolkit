/* eslint-disable import/no-extraneous-dependencies */
import spawn from 'cross-spawn';
import fs from 'fs';
import path from 'path';

describe('build project with block manifest generation', () => {
	beforeAll(() => {
		spawn.sync('node', ['../../scripts/build'], {
			cwd: __dirname,
		});
	});

	it('generates blocks-manifest.php file', () => {
		const manifestPath = path.join(__dirname, 'dist', 'blocks-manifest.php');
		expect(fs.existsSync(manifestPath)).toBeTruthy();
	});

	it('manifest contains all three blocks', () => {
		const manifestPath = path.join(__dirname, 'dist', 'blocks-manifest.php');
		const manifestContent = fs.readFileSync(manifestPath, 'utf8');

		expect(manifestContent).toContain('example-one');
		expect(manifestContent).toContain('example-two');
		expect(manifestContent).toContain('example-three');
	});

	it('manifest has correct PHP structure', () => {
		const manifestPath = path.join(__dirname, 'dist', 'blocks-manifest.php');
		const manifestContent = fs.readFileSync(manifestPath, 'utf8');

		// Check for PHP opening tag
		expect(manifestContent).toMatch(/^<\?php/);

		// Check for return statement
		expect(manifestContent).toContain('return array(');

		// Check for comment
		expect(manifestContent).toContain('// This file is generated. Do not modify it manually.');
	});

	it('manifest contains block metadata', () => {
		const manifestPath = path.join(__dirname, 'dist', 'blocks-manifest.php');
		const manifestContent = fs.readFileSync(manifestPath, 'utf8');

		// Check for block titles
		expect(manifestContent).toContain('Example Block One');
		expect(manifestContent).toContain('Example Block Two');
		expect(manifestContent).toContain('Example Block Three');

		// Check for block names
		expect(manifestContent).toContain('test/example-one');
		expect(manifestContent).toContain('test/example-two');
		expect(manifestContent).toContain('test/example-three');
	});

	it('manifest contains file paths', () => {
		const manifestPath = path.join(__dirname, 'dist', 'blocks-manifest.php');
		const manifestContent = fs.readFileSync(manifestPath, 'utf8');

		// Check for file:// paths
		expect(manifestContent).toContain('file:./index.js');
		expect(manifestContent).toContain('file:./view.js');
		expect(manifestContent).toContain('file:./style.css');
		expect(manifestContent).toContain('file:./editor.css');
	});

	it('manifest includes transformed JavaScript paths from TypeScript sources', () => {
		const manifestPath = path.join(__dirname, 'dist', 'blocks-manifest.php');
		const manifestContent = fs.readFileSync(manifestPath, 'utf8');

		// Should not contain .ts extension (transformed by CopyWebpackPlugin)
		expect(manifestContent).not.toContain('file:./index.ts');

		// Should contain transformed .js extension for example-three
		// Extract the example-three block section
		const exampleThreeMatch = manifestContent.match(
			/'example-three'\s*=>\s*array\(([\s\S]*?)\),\s*'example-(one|two)'/,
		);

		// Verify manifest includes the already-transformed path
		expect(exampleThreeMatch).not.toBeNull();
		expect(exampleThreeMatch[1]).toContain('file:./index.js');
	});

	it('manifest includes transformed CSS paths from SCSS sources', () => {
		const manifestPath = path.join(__dirname, 'dist', 'blocks-manifest.php');
		const manifestContent = fs.readFileSync(manifestPath, 'utf8');

		// Should not contain .scss extension (transformed by CopyWebpackPlugin)
		expect(manifestContent).not.toContain('file:./style.scss');

		// Should contain transformed .css extension
		const exampleThreeMatch = manifestContent.match(
			/'example-three'\s*=>\s*array\(([\s\S]*?)\),\s*('example-|$)/,
		);

		// Verify manifest includes the already-transformed path
		expect(exampleThreeMatch).not.toBeNull();
		expect(exampleThreeMatch[1]).toContain('file:./style.css');
	});

	it('builds blocks correctly', () => {
		// Verify block files are built
		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'blocks', 'example-one', 'block.json')),
		).toBeTruthy();
		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'blocks', 'example-one', 'index.js')),
		).toBeTruthy();
		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'blocks', 'example-two', 'block.json')),
		).toBeTruthy();
		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'blocks', 'example-three', 'block.json')),
		).toBeTruthy();
	});

	it('manifest is valid PHP array structure', () => {
		const manifestPath = path.join(__dirname, 'dist', 'blocks-manifest.php');
		const manifestContent = fs.readFileSync(manifestPath, 'utf8');

		// Check that all three blocks are present as keys
		const blockKeyMatches = manifestContent.match(/'example-(one|two|three)'\s*=>\s*array\(/g);
		expect(blockKeyMatches).toHaveLength(3);

		// Ensure proper PHP closing
		expect(manifestContent.trim().endsWith(';')).toBeTruthy();
	});
});
