import { getBuildFiles as getBuildFilesMock } from '../../utils/config';
import { hasProjectFile as hasProjectFileMock } from '../../utils/file';
import { getPackage as getPackageMock } from '../../utils/package';
import webpackSerializer from '../../test-utils/webpack-serializer';

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
	beforeAll(() => {
		expect.addSnapshotSerializer(webpackSerializer);
	});

	beforeEach(() => {
		getPackageMock.mockReset();
		getBuildFilesMock.mockReset();
	});

	it('returns proper configs for project configs', () => {
		const entryBuildFiles = {
			entry1: 'entry1.js',
			entry2: 'entry2.js',
			entry3: 'entry3.js',
		};
		getBuildFilesMock.mockReturnValue(entryBuildFiles);
		getPackageMock.mockReturnValue({
			'@10up/scripts': {
				entry: entryBuildFiles,
				paths: {
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
	});

	it('returns proper configs for package config', () => {
		getBuildFilesMock.mockReturnValue({});
		getPackageMock.mockReturnValue({
			name: '@10up/component-library',
			source: 'src/index.js',
			main: 'dist/index.js',
			'umd:main': 'src/index.umd.js',
			dependencies: {
				'read-pkg': '^5.2.0',
				'read-pkg-up': '^1.0.1',
				'resolve-bin': '^0.4.0',
			},
			'@10up/scripts': {},
		});

		let webpackConfig;
		jest.isolateModules(() => {
			// eslint-disable-next-line global-require
			webpackConfig = require('../webpack.config');
		});

		expect(webpackConfig).toMatchSnapshot();
	});

	it('returns proper configs for package config with peer deps', () => {
		getBuildFilesMock.mockReturnValue({});
		getPackageMock.mockReturnValue({
			name: '@10up/component-library',
			source: 'src/index.js',
			main: 'dist/index.js',
			'umd:main': 'src/index.umd.js',
			dependencies: {
				'read-pkg': '^5.2.0',
				'read-pkg-up': '^1.0.1',
				'resolve-bin': '^0.4.0',
			},
			peerDependencies: {
				lodash: '^5.4.3',
			},
			'@10up/scripts': {},
		});

		let webpackConfig;
		jest.isolateModules(() => {
			// eslint-disable-next-line global-require
			webpackConfig = require('../webpack.config');
		});

		expect(webpackConfig).toMatchSnapshot();
	});

	it('properly detects user config files', () => {
		hasProjectFileMock.mockReturnValue(true);
		getBuildFilesMock.mockReturnValue({});
		getPackageMock.mockReturnValue({
			name: '@10up/component-library',
			source: 'src/index.js',
			main: 'dist/index.js',
			'umd:main': 'src/index.umd.js',
			dependencies: {
				'read-pkg': '^5.2.0',
				'read-pkg-up': '^1.0.1',
				'resolve-bin': '^0.4.0',
			},
			peerDependencies: {
				lodash: '^5.4.3',
			},
			'@10up/scripts': {},
		});

		let webpackConfig;
		jest.isolateModules(() => {
			// eslint-disable-next-line global-require
			webpackConfig = require('../webpack.config');
		});

		expect(webpackConfig).toMatchSnapshot();
	});
});
