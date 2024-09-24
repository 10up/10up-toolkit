/* eslint-disable import/no-extraneous-dependencies */
import spawn from 'cross-spawn';
import fs from 'fs';
import path from 'path';

describe('build a project', () => {
	it('builds and compiles css with global css', async () => {
		spawn.sync('node', ['../../scripts/build'], {
			cwd: __dirname,
		});

		const frontendCss = path.join(
			__dirname,
			'dist',
			'blocks',
			'autoenqueue',
			'core',
			'heading.css',
		);

		expect(fs.existsSync(frontendCss)).toBeTruthy();
		expect(
			fs.existsSync(
				path.join(__dirname, 'dist', 'blocks', 'autoenqueue', 'core', 'heading.asset.php'),
			),
		).toBeTruthy();

		const compiledCSS = fs.readFileSync(frontendCss).toString();

		// expect the compiled CSS to contain "min-width: 30em"
		expect(compiledCSS).toMatch('min-width: 30em');
	});
});
