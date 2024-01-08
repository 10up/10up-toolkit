/* eslint-disable import/no-extraneous-dependencies */
import spawn from 'cross-spawn';
import fs from 'fs';
import path from 'path';

describe('build a project (without useBlockAssets)', () => {
	it('builds and compiles js and css', async () => {
		spawn.sync('node', ['../../scripts/build'], {
			cwd: __dirname,
		});

		expect(fs.existsSync(path.join(__dirname, 'dist', 'js', 'admin.js'))).toBeTruthy();
		expect(fs.existsSync(path.join(__dirname, 'dist', 'js', 'admin.asset.php'))).toBeTruthy();
		expect(fs.existsSync(path.join(__dirname, 'dist', 'js', 'frontend.js'))).toBeTruthy();
		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'js', 'frontend.asset.php')),
		).toBeTruthy();
		expect(fs.existsSync(path.join(__dirname, 'dist', 'css', 'frontend-css.css'))).toBeTruthy();
		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'css', 'frontend-css.asset.php')),
		).toBeTruthy();
	});

	it('adds react dependencies to .asset.php files', () => {
		spawn.sync('node', ['../../scripts/build'], {
			cwd: __dirname,
		});
		const frontendAssetPHP = fs
			.readFileSync(path.join(__dirname, 'dist', 'js', 'frontend.asset.php'))
			.toString();

		expect(frontendAssetPHP).toMatch('wp-element');
		expect(frontendAssetPHP).toMatch('react-dom');
		expect(frontendAssetPHP).toMatch('react');
	});

	it('extracts css imported in js files', () => {
		spawn.sync('node', ['../../scripts/build'], {
			cwd: __dirname,
		});
		// chunk name for css imported in js matches the js entry point
		expect(fs.existsSync(path.join(__dirname, 'dist', 'css', 'admin.css'))).toBeTruthy();

		// this should not exist since it is not an entry point on its own
		expect(fs.existsSync(path.join(__dirname, 'dist', 'css', 'admin-styles.css'))).toBeFalsy();
	});

	it('builds blocks', () => {
		// without useBlockAssets block.json should not be copied
		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'blocks', 'example-block', 'block.json')),
		).toBeFalsy();

		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'blocks', 'example-block', 'editor.js')),
		).toBeTruthy();

		// css is being imported from editor.js so its name should be editor.css
		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'blocks', 'example-block', 'editor.css')),
		).toBeTruthy();
	});
});
