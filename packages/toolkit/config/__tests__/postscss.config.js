const configFactory = require('../postcss.config');

describe('postcss.config.js', () => {
	it('builds a proper postcss config file for editor styles', () => {
		expect(
			configFactory({
				file: '/path/to/editor-style.css',
				env: 'production',
			}),
		).toMatchSnapshot('env=production');

		expect(
			configFactory({
				file: '/path/to/editor-style.css',
				env: 'development',
			}),
		).toMatchSnapshot('env=development');
	});

	it('build a proper postcss config file for non-editor styles', () => {
		expect(
			configFactory({
				file: '/path/to/regular.css',
				env: 'production',
			}),
		).toMatchSnapshot('env=production');

		expect(
			configFactory({
				file: '/path/to/regular.css',
				env: 'development',
			}),
		).toMatchSnapshot('env=development');
	});
});
