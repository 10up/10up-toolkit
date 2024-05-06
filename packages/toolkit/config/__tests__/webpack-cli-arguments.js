import { getBuildFiles as getBuildFilesMock } from '../../utils/config';
import { hasProjectFile as hasProjectFileMock } from '../../utils/file';
import { getPackage as getPackageMock } from '../../utils/package';

jest.mock('../../utils/package', () => {
	const module = jest.requireActual('../../utils/package');

	jest.spyOn(module, 'getPackage');

	return module;
});

jest.mock('../../utils/config', () => {
	const module = jest.requireActual('../../utils/config');

	jest.spyOn(module, 'getBuildFiles');

	return module;
});

jest.mock('../../utils/file', () => {
	const module = jest.requireActual('../../utils/file');

	jest.spyOn(module, 'hasProjectFile');

	return module;
});

describe('webpack.config.js', () => {
	beforeEach(() => {
		getPackageMock.mockReset();
		getBuildFilesMock.mockReset();
		hasProjectFileMock.mockReset();
		process.argv.splice(2, process.argv.length);
	});

	it('returns proper configs for package config with commonjs2 format', () => {
		process.argv.push('--format=commonjs');
		getBuildFilesMock.mockReturnValue({});
		getPackageMock.mockReturnValue({
			name: '@10up/component-library',
			source: 'src/index.js',
			main: 'dist/index.js',
			'umd:main': 'dist/index.umd.js',
			dependencies: {
				'read-pkg': '^5.2.0',
				'read-pkg-up': '^1.0.1',
				'resolve-bin': '^0.4.0',
			},
		});

		let webpackConfig;
		jest.isolateModules(() => {
			// eslint-disable-next-line global-require
			webpackConfig = require('../webpack.config');
		});

		expect(webpackConfig).toMatchSnapshot();
	});

	it('adds devServer config when passing the --dev-server flag', () => {
		process.argv.push('--dev-server');
		process.argv.push('--port=3000');
		getBuildFilesMock.mockReturnValue({});
		hasProjectFileMock.mockImplementation((file) => {
			return file === 'public/index.html';
		});
		getPackageMock.mockReturnValue({
			name: '@10up/component-library',
			source: 'src/index.js',
			main: 'dist/index.js',
			'umd:main': 'dist/index.umd.js',
			dependencies: {
				'read-pkg': '^5.2.0',
				'read-pkg-up': '^1.0.1',
				'resolve-bin': '^0.4.0',
			},
		});

		let webpackConfig;
		jest.isolateModules(() => {
			// eslint-disable-next-line global-require
			webpackConfig = require('../webpack.config');
		});

		expect(webpackConfig).toMatchSnapshot();
	});

	it('allows changing browsersync port', () => {
		process.argv.push('--port=3000');
		const entryBuildFiles = {
			entry1: 'entry1.js',
		};
		getBuildFilesMock.mockReturnValue(entryBuildFiles);
		getPackageMock.mockReturnValue({
			'10up-toolkit': {
				entry: entryBuildFiles,
				devURL: 'http://wptest.test',
			},
		});
		let webpackConfig;
		jest.isolateModules(() => {
			// eslint-disable-next-line global-require
			webpackConfig = require('../webpack.config');
		});

		expect(webpackConfig).toMatchSnapshot();
	});

	it('includes webpack-bundle-analyzer when using --analyze', () => {
		process.argv.push('--analyze');
		process.env.NODE_ENV = 'production';
		const entryBuildFiles = {
			entry1: 'entry1.js',
		};
		getBuildFilesMock.mockReturnValue(entryBuildFiles);
		getPackageMock.mockReturnValue({
			'10up-toolkit': {
				entry: entryBuildFiles,
			},
		});
		let webpackConfig;
		jest.isolateModules(() => {
			// eslint-disable-next-line global-require
			webpackConfig = require('../webpack.config');
		});

		expect(webpackConfig).toMatchSnapshot();

		// test it doesn't enable when not in productio mode
		process.env.NODE_ENV = '';

		jest.isolateModules(() => {
			// eslint-disable-next-line global-require
			webpackConfig = require('../webpack.config');
		});

		expect(webpackConfig).toMatchSnapshot();
	});

	it('takes the --target option into account', () => {
		getBuildFilesMock.mockReturnValue({});
		getPackageMock.mockReturnValue({
			name: '@10up/component-library',
			source: 'src/index.js',
			main: 'dist/index.js',
			exports: {
				'.': './dist/index.js',
				'./utils-fake-module': './dist/utils-fake-module-dist.js',
				'./config-fake-module': './dist/config-fake-module-dist.js',
			},
			dependencies: {
				'read-pkg': '^5.2.0',
				'read-pkg-up': '^1.0.1',
				'resolve-bin': '^0.4.0',
			},
		});

		process.argv.push('--target=node');
		let webpackConfig;
		jest.isolateModules(() => {
			// eslint-disable-next-line global-require
			webpackConfig = require('../webpack.config');
		});

		expect(webpackConfig).toMatchSnapshot();
		process.argv.pop();
	});

	it('takes the --sourcemap option into account', () => {
		const originalNodeEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = 'production';

		getBuildFilesMock.mockReturnValue({});
		getPackageMock.mockReturnValue({
			name: '@10up/component-library',
			source: 'src/index.js',
			main: 'dist/index.js',
			dependencies: {
				'read-pkg': '^5.2.0',
			},
		});

		process.argv.push('--sourcemap');
		let webpackConfig;
		jest.isolateModules(() => {
			// eslint-disable-next-line global-require
			webpackConfig = require('../webpack.config');
		});
		expect(webpackConfig.devtool).toBe('source-map');
		process.argv.pop();
		process.env.NODE_ENV = originalNodeEnv;
	});

	it('builds modules', () => {
		const originalNodeEnv = process.env.NODE_ENV;
		process.env.NODE_ENV = 'production';
		process.argv.push('--block-modules');
		const entryBuildFiles = {
			entry1: 'entry1.js',
			entry2: 'entry2.js',
			entry3: 'entry3.js',
		};
		getBuildFilesMock.mockReturnValue(entryBuildFiles);
		getPackageMock.mockReturnValue({
			'10up-toolkit': {
				entry: entryBuildFiles,
				paths: {
					blocksDir: './includes2/blocks/',
					srcDir: './assets2/',
					cssLoaderPaths: ['./assets2/css', './includes2/blocks'],
					copyAssetsDir: './assets2/',
				},
			},
		});
		let webpackConfig;
		jest.isolateModules(() => {
			// eslint-disable-next-line global-require
			webpackConfig = require('../webpack.config');
		});

		expect(webpackConfig).toMatchSnapshot();
		process.argv.pop();
		process.env.NODE_ENV = originalNodeEnv;
	});
});
