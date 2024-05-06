/* eslint-disable import/no-extraneous-dependencies */
import spawn from 'cross-spawn';
import fs from 'fs';
import path from 'path';

describe('build a project with moduleEntry', () => {
	it('builds and compiles js and css', async () => {
		spawn.sync('node', ['../../scripts/build', '--block-modules'], {
			cwd: __dirname,
		});

		const adminJsPath = path.join(__dirname, 'dist', 'js', 'admin.js');

		expect(fs.existsSync(adminJsPath)).toBeTruthy();
		expect(fs.existsSync(path.join(__dirname, 'dist', 'css', 'frontend-css.css'))).toBeTruthy();
		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'css', 'frontend-css.asset.php')),
		).toBeTruthy();

		// ensure admin is a module
		const adminJs = fs.readFileSync(adminJsPath).toString();
		expect(adminJs).toMatch(/export {.*};/);
	});

	it('extracts css imported in js files', () => {
		spawn.sync('node', ['../../scripts/build', '--block-modules'], {
			cwd: __dirname,
		});
		// chunk name for css imported in js matches the js entry point
		expect(fs.existsSync(path.join(__dirname, 'dist', 'css', 'admin.css'))).toBeTruthy();

		// this should not exist since it is not an entry point on its own
		expect(fs.existsSync(path.join(__dirname, 'dist', 'css', 'admin-styles.css'))).toBeFalsy();
	});
});
