const optimization = require('../optimization');

describe('optimization module function', () => {
	it('returns production config', () => {
		expect(
			optimization({ isProduction: true, projectConfig: { hot: false, analyze: false } }),
		).toMatchObject({
			concatenateModules: true,
			runtimeChunk: false,
		});

		expect(
			optimization({ isProduction: true, projectConfig: { hot: false, analyze: true } }),
		).toMatchObject({
			concatenateModules: false,
			runtimeChunk: false,
		});
	});

	it('returns development config', () => {
		expect(
			optimization({ isProduction: false, projectConfig: { hot: true, analyze: false } }),
		).toMatchObject({
			concatenateModules: false,
			runtimeChunk: 'single',
		});

		expect(
			optimization({ isProduction: false, projectConfig: { hot: false, analyze: false } }),
		).toMatchObject({
			concatenateModules: false,
			runtimeChunk: false,
		});
	});
});
