/* eslint-disable import/no-extraneous-dependencies */
import spawn from 'cross-spawn';
import fs from 'fs';
import path from 'path';

describe('build a project (without useBlockAssets)', () => {
	beforeAll(() => {
		spawn.sync('node', ['../../scripts/build', '--format=none'], {
			cwd: __dirname,
		});
	});

	it('builds and compiles js and css', async () => {
		expect(fs.existsSync(path.join(__dirname, 'dist', 'index.js'))).toBeTruthy();
		expect(fs.existsSync(path.join(__dirname, 'dist', 'index.css'))).toBeTruthy();
	});
});
