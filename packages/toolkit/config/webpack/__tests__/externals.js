const externals = require('../externals');

describe('externals module function', () => {
	it('returns default externals for project config', () => {
		expect(externals({ isPackage: false, packageConfig: {} })).toEqual({
			jquery: 'jQuery',
			lodash: 'lodash',
		});
	});

	it('returns array of externals for package config', () => {
		expect(
			externals({
				isPackage: true,
				packageConfig: {
					externals: ['jquery', 'lodash'],
					packageType: 'all',
				},
			}),
		).toEqual({
			jquery: 'commonjs2 jquery',
			lodash: 'commonjs2 lodash',
		});

		expect(
			externals({
				isPackage: true,
				packageConfig: {
					externals: ['jquery', 'lodash'],
					packageType: 'umd',
				},
			}),
		).toEqual({
			jquery: {
				amd: 'jquery',
				commonjs: 'jquery',
				commonjs2: 'jquery',
			},
			lodash: {
				amd: 'lodash',
				commonjs: 'lodash',
				commonjs2: 'lodash',
			},
		});

		expect(
			externals({
				isPackage: true,
				packageConfig: {
					externals: ['jquery', 'lodash'],
					packageType: 'commonjs2',
				},
			}),
		).toEqual({
			jquery: 'commonjs2 jquery',
			lodash: 'commonjs2 lodash',
		});
	});
});
