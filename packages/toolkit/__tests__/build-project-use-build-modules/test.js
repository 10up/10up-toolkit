/* eslint-disable import/no-extraneous-dependencies */
import spawn from 'cross-spawn';
import fs from 'fs';
import path from 'path';

describe('build a project (withb block-modules)', () => {
	beforeAll(() => {
		spawn.sync('node', ['../../scripts/build', '--block-modules'], {
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

		const viewModuleAsset = fs
			.readFileSync(
				path.join(__dirname, 'dist', 'blocks', 'example', 'view-module.asset.php'),
			)
			.toString();

		expect(viewModuleAsset).toMatch('@wordpress/interactivity');
		expect(viewModuleAsset).toMatch("'type' => 'module'");
	});

	it('builds blocks with modules for vieewScriptModule', () => {
		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'blocks', 'example', 'block.json')),
		).toBeTruthy();

		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'blocks', 'example', 'index.js')),
		).toBeTruthy();

		const viewModuleFile = path.join(__dirname, 'dist', 'blocks', 'example', 'view-module.js');

		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'blocks', 'example', 'view-module.js')),
		).toBeTruthy();

		const viewModuleFileContents = fs.readFileSync(viewModuleFile).toString();

		expect(viewModuleFileContents).toMatch(/import \* as .* from "@wordpress\/interactivity";/);
	});
});
