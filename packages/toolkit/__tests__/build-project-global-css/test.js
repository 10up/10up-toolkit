/* eslint-disable import/no-extraneous-dependencies */
import spawn from 'cross-spawn';
import fs from 'fs';
import path from 'path';

describe('build a project', () => {
	it('builds and compiles css with global css', async () => {
		spawn.sync('node', ['../../scripts/build'], {
			cwd: __dirname,
		});

		const frontendCss = path.join(__dirname, 'dist', 'css', 'frontend-css.css');

		expect(fs.existsSync(frontendCss)).toBeTruthy();
		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'css', 'frontend-css.asset.php')),
		).toBeTruthy();

		const compiledCSS = fs.readFileSync(frontendCss).toString();
		expect(compiledCSS).toMatch('@media (--bp-small)');

		// TODO: ensure mixins are processed correctly
	});
});
