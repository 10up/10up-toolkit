/* eslint-disable import/no-extraneous-dependencies */
import spawn from 'cross-spawn';
import fs from 'fs';
import path from 'path';

describe('build a project', () => {
	it('builds and compiles css with global css', async () => {
		spawn.sync('node', ['../../scripts/build'], {
			cwd: __dirname,
		});

		const headingBlockCSS = path.join(
			__dirname,
			'dist',
			'blocks',
			'autoenqueue',
			'core',
			'heading.css',
		);

		const groupBlockCSS = path.join(
			__dirname,
			'dist',
			'blocks',
			'autoenqueue',
			'core',
			'group.css',
		);

		expect(fs.existsSync(headingBlockCSS)).toBeTruthy();
		expect(fs.existsSync(groupBlockCSS)).toBeTruthy();
		expect(
			fs.existsSync(
				path.join(__dirname, 'dist', 'blocks', 'autoenqueue', 'core', 'heading.asset.php'),
			),
		).toBeTruthy();

		const compiledHeadingBlockCSS = fs.readFileSync(headingBlockCSS).toString();
		const compiledGroupBlockCSS = fs.readFileSync(groupBlockCSS).toString();

		// expect the compiled CSS to contain "min-width: 30em"
		expect(compiledHeadingBlockCSS).toMatch('min-width: 30em');
		expect(compiledGroupBlockCSS).toMatch('min-width: 30em');
	});
});
