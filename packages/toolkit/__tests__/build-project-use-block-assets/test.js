/* eslint-disable import/no-extraneous-dependencies */
import spawn from 'cross-spawn';
import fs from 'fs';
import path from 'path';

describe('build a project (with useBlockAssets)', () => {
	beforeAll(() => {
		spawn.sync('node', ['../../scripts/build'], {
			cwd: __dirname,
		});
	});

	it('builds and compiles js and css', async () => {
		expect(fs.existsSync(path.join(__dirname, 'dist', 'js', 'admin.js'))).toBeTruthy();
		expect(fs.existsSync(path.join(__dirname, 'dist', 'js', 'admin.asset.php'))).toBeTruthy();
		expect(fs.existsSync(path.join(__dirname, 'dist', 'js', 'frontend.js'))).toBeTruthy();
		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'js', 'frontend.asset.php')),
		).toBeTruthy();
		expect(fs.existsSync(path.join(__dirname, 'dist', 'css', 'frontend.css'))).toBeTruthy();
	});

	it('adds react dependencies to .asset.php files', () => {
		const frontendAssetPHP = fs
			.readFileSync(path.join(__dirname, 'dist', 'js', 'frontend.asset.php'))
			.toString();

		expect(frontendAssetPHP).toMatch('wp-element');
		expect(frontendAssetPHP).toMatch('react-dom');
		expect(frontendAssetPHP).toMatch('react');
	});

	it('extracts css imported in js files', () => {
		// chunk name for css imported in js matches the js entry point
		expect(fs.existsSync(path.join(__dirname, 'dist', 'css', 'admin.css'))).toBeTruthy();

		// this should not exist since it is not an entry point on its own
		expect(fs.existsSync(path.join(__dirname, 'dist', 'css', 'admin-styles.css'))).toBeFalsy();
	});

	it('builds blocks', () => {
		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'blocks', 'example', 'block.json')),
		).toBeTruthy();

		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'blocks', 'example', 'index.js')),
		).toBeTruthy();

		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'blocks', 'example', 'editor-styles.css')),
		).toBeTruthy();
	});

	it('generates version when using style/viewStyle', () => {
		const blockJson = JSON.parse(
			fs
				.readFileSync(path.join(__dirname, 'dist', 'blocks', 'example', 'block.json'))
				.toString(),
		);
		expect(blockJson).toMatchObject({
			version: 'c5b9d82d328781bf3f4a5c8f19dfb700494821c2b514b7e5e724154f1eea10eb',
		});
	});
});
