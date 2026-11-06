/* eslint-disable import/no-extraneous-dependencies */
import { describe, it, expect } from 'vite-plus/test';
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

		// The global `@custom-media` resolved; Lightning CSS minifies it to `(width>=30em)`.
		expect(compiledHeadingBlockCSS).toMatch(/\(width>=30em\)|min-width:\s*30em/);
		expect(compiledGroupBlockCSS).toMatch(/\(width>=30em\)|min-width:\s*30em/);
	});
});
