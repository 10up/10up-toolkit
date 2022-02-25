import webpackSerializer from '../../test-utils/webpack-serializer';

describe('webpack.config.js', () => {
	beforeAll(() => {
		expect.addSnapshotSerializer(webpackSerializer);
	});

	it('returns proper configs for project configs', () => {
		let webpackConfig;
		jest.isolateModules(() => {
			// eslint-disable-next-line global-require
			webpackConfig = require('../webpack-fast-refresh.config');
		});

		expect(webpackConfig).toMatchSnapshot();
	});
});
