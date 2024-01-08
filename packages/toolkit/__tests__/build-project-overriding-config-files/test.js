/* eslint-disable import/no-extraneous-dependencies */
import spawn from 'cross-spawn';
import fs from 'fs';
import path from 'path';

describe('build a project (overriding config)', () => {
	it('builds and compiles js and css', async () => {
		spawn.sync('node', ['../../scripts/build'], {
			cwd: __dirname,
		});

		expect(fs.existsSync(path.join(__dirname, 'dist', 'js', 'test', 'admin.js'))).toBeTruthy();
		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'js', 'test', 'admin.asset.php')),
		).toBeTruthy();
		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'js', 'test', 'frontend.js')),
		).toBeTruthy();
		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'js', 'test', 'frontend.asset.php')),
		).toBeTruthy();
		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'css', 'test', 'frontend-css.css')),
		).toBeTruthy();
		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'css', 'test', 'frontend-css.asset.php')),
		).toBeTruthy();
	});
});
