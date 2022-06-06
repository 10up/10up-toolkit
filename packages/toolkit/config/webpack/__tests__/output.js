const path = require('path');
const output = require('../output');

describe('output module function', () => {
	it('return package output config when isPacakge is true', () => {
		let o = output({
			isPackage: true,
			packageConfig: { main: 'index.js', packageType: 'all' },
			projectConfig: {},
		});

		expect(o.libraryTarget).toBe('commonjs2');
		expect(o.path).toBe(path.resolve(process.cwd(), 'dist'));

		o = output({
			isPackage: true,
			packageConfig: { main: 'index.js', packageType: 'module' },
			projectConfig: {},
		});

		expect(o.libraryTarget).toBe('module');
		expect(o.path).toBe(path.resolve(process.cwd(), 'dist'));
	});

	it('return project output config when isPacakge is false', () => {
		expect(
			output({
				isPackage: false,
				packageConfig: {},
				projectConfig: { hot: false, filenames: { jsChunk: 'js/[name].js' } },
			}),
		).toMatchObject({
			chunkFilename: 'js/[name].js',
			clean: true,
			path: path.resolve(process.cwd(), 'dist'),
		});

		expect(
			output({
				isPackage: false,
				packageConfig: {},
				projectConfig: { hot: true, filenames: { jsChunk: 'js/[name].js' } },
			}),
		).toMatchObject({
			chunkFilename: 'js/[name].js',
			clean: false,
			path: path.resolve(process.cwd(), 'dist'),
		});
	});
});
