/* eslint-disable import/no-extraneous-dependencies */
import spawn from 'cross-spawn';
import fs from 'fs';
import path from 'path';

describe('build a project', () => {
	it('builds and compiles css with global css', async () => {
		spawn.sync('node', ['../../scripts/build'], {
			cwd: __dirname,
		});

		/* expect(fs.existsSync(path.join(__dirname, 'dist', 'js', 'admin.js'))).toBeTruthy();
		expect(fs.existsSync(path.join(__dirname, 'dist', 'js', 'admin.asset.php'))).toBeTruthy();
		expect(fs.existsSync(path.join(__dirname, 'dist', 'js', 'frontend.js'))).toBeTruthy();
		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'js', 'frontend.asset.php')),
		). toBeTruthy(); */
		expect(fs.existsSync(path.join(__dirname, 'dist', 'css', 'frontend-css.css'))).toBeTruthy();
		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'css', 'frontend-css.asset.php')),
		).toBeTruthy();
	});
});
