const externals = require('../externals');
const getDevServer = require('../devServer');

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

describe('devServer', () => {
	const baseHotOptions = {
		isPackage: false,
		isModule: false,
		projectConfig: {
			devServer: false,
			devURL: 'http://example.test',
			hot: true,
			devServerPort: 3000,
		},
	};

	it('returns undefined when neither devServer nor hot is enabled', () => {
		expect(
			getDevServer({
				...baseHotOptions,
				projectConfig: { ...baseHotOptions.projectConfig, hot: false },
			}),
		).toBeUndefined();
		expect(
			getDevServer({
				isPackage: false,
				isModule: false,
				projectConfig: {
					devServer: false,
					devURL: 'http://example.test',
					hot: false,
					devServerPort: 3000,
				},
			}),
		).toBeUndefined();
	});

	it('uses array-based proxy configuration (v5 style) when useLegacyProxy is false', () => {
		const result = getDevServer({ ...baseHotOptions, useLegacyProxy: false });
		expect(result).toBeDefined();
		expect(result.proxy).toEqual([
			{
				context: '/dist',
				pathRewrite: {
					'^/dist': '',
				},
			},
		]);
	});

	it('uses array-based proxy configuration (v5 style) when useLegacyProxy is omitted', () => {
		const result = getDevServer(baseHotOptions);
		expect(result).toBeDefined();
		expect(Array.isArray(result.proxy)).toBe(true);
		expect(result.proxy[0]).toHaveProperty('context', '/dist');
		expect(result.proxy[0].pathRewrite).toEqual({ '^/dist': '' });
	});

	it('uses object-based proxy configuration (legacy style) when useLegacyProxy is true', () => {
		const result = getDevServer({ ...baseHotOptions, useLegacyProxy: true });
		expect(result).toBeDefined();
		expect(result.proxy).toEqual({
			'/dist': {
				pathRewrite: {
					'^/dist': '',
				},
			},
		});
	});
});
