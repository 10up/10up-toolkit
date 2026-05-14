import { getBuildFiles as getBuildFilesMock } from '../../utils/config';
import { hasProjectFile as hasProjectFileMock } from '../../utils/file';
import { getPackage as getPackageMock } from '../../utils/package';

rstest.mock('../../utils/package', () => {
	const module = rstest.requireActual('../../utils/package');

	rstest.spyOn(module, 'getPackage');

	return module;
});

rstest.mock('../../utils/config', () => {
	const module = rstest.requireActual('../../utils/config');

	rstest.spyOn(module, 'getBuildFiles');

	return module;
});

rstest.mock('../../utils/file', () => {
	const module = rstest.requireActual('../../utils/file');

	rstest.spyOn(module, 'hasProjectFile');

	return module;
});

describe('rspack.config.js', () => {
	beforeEach(() => {
		getPackageMock.mockReset();
		getBuildFilesMock.mockReset();
		hasProjectFileMock.mockReset();
	});

	it('returns proper configs for project configs', () => {
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
				devURL: 'http://project.test',
			},
		});
		let rspackConfig;
		rstest.isolateModules(() => {
			// eslint-disable-next-line global-require
			rspackConfig = require('../rspack.config');
		});

		expect(rspackConfig).toMatchSnapshot();
	});

	it('returns proper configs for package config', () => {
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

		let rspackConfig;
		rstest.isolateModules(() => {
			// eslint-disable-next-line global-require
			rspackConfig = require('../rspack.config');
		});

		expect(rspackConfig).toMatchSnapshot();
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

		let rspackConfig;
		rstest.isolateModules(() => {
			// eslint-disable-next-line global-require
			rspackConfig = require('../rspack.config');
		});

		expect(rspackConfig).toMatchSnapshot();
		process.argv.pop();
	});

	it('returns proper configs for package config with peer deps', () => {
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
			peerDependencies: {
				lodash: '^5.4.3',
			},
		});

		let rspackConfig;
		rstest.isolateModules(() => {
			// eslint-disable-next-line global-require
			rspackConfig = require('../rspack.config');
		});

		expect(rspackConfig).toMatchSnapshot();
	});

	it('properly detects user config files in package mode', () => {
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
			peerDependencies: {
				lodash: '^5.4.3',
			},
		});

		let rspackConfig;
		rstest.isolateModules(() => {
			// eslint-disable-next-line global-require
			rspackConfig = require('../rspack.config');
		});

		expect(rspackConfig).toMatchSnapshot();
	});

	it('properly detects user config files in project mode', () => {
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
		let rspackConfig;
		rstest.isolateModules(() => {
			// eslint-disable-next-line global-require
			rspackConfig = require('../rspack.config');
		});

		expect(rspackConfig).toMatchSnapshot();
	});

	it('takes the sourcemap config into account', () => {
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
			'10up-toolkit': {
				sourcemap: true,
			},
		});

		let rspackConfig;
		rstest.isolateModules(() => {
			// eslint-disable-next-line global-require
			rspackConfig = require('../rspack.config');
		});

		expect(rspackConfig.devtool).toBe('source-map');

		getPackageMock.mockReturnValue({
			name: '@10up/component-library',
			source: 'src/index.js',
			main: 'dist/index.js',
			dependencies: {
				'read-pkg': '^5.2.0',
			},
			'10up-toolkit': {
				sourcemap: false,
			},
		});

		rstest.isolateModules(() => {
			// eslint-disable-next-line global-require
			rspackConfig = require('../rspack.config');
		});

		expect(rspackConfig.devtool).toBe(false);

		process.env.NODE_ENV = originalNodeEnv;
	});
});
