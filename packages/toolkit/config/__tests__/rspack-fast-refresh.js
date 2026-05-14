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

describe('rspack.config.js', () => {
	it('returns proper webpack fast refresh configs for project configs', () => {
		let rspackConfig;
		jest.isolateModules(() => {
			// eslint-disable-next-line global-require
			rspackConfig = require('../rspack-fast-refresh.config');
		});

		expect(rspackConfig).toMatchSnapshot();
	});

	it('includes react-webpack-fast-refresh with the --hot option', () => {
		process.argv.push('--hot');
		process.env.NODE_ENV = 'development';
		hasProjectFileMock.mockImplementation((file) => file === 'rspack.config.js');
		const entryBuildFiles = {
			entry1: 'entry1.js',
		};
		getBuildFilesMock.mockReturnValue(entryBuildFiles);
		getPackageMock.mockReturnValue({
			'10up-toolkit': {
				entry: entryBuildFiles,
			},
		});
		let rspackConfig;
		jest.isolateModules(() => {
			// eslint-disable-next-line global-require
			rspackConfig = require('../rspack.config');
		});

		expect(rspackConfig).toMatchSnapshot();
	});
});
