/* eslint-disable import/no-extraneous-dependencies */
import spawn from 'cross-spawn';
import fs from 'fs';
import path from 'path';

describe('build a project (with linaria)', () => {
	beforeAll(() => {
		spawn.sync('node', ['../../scripts/build'], {
			cwd: __dirname,
		});
	});

	it('builds blocks', () => {
		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'blocks', 'example', 'block.json')),
		).toBeTruthy();

		expect(
			fs.existsSync(path.join(__dirname, 'dist', 'blocks', 'example', 'index.js')),
		).toBeTruthy();

		const indexCSS = path.join(__dirname, 'dist', 'blocks', 'example', 'index.css');
		expect(fs.existsSync(indexCSS)).toBeTruthy();

		// ensure it is extracting the css-in-js
		const compiledCSS = fs.readFileSync(indexCSS).toString();
		expect(compiledCSS).toMatch('border:2px dashed black');
	});
});
