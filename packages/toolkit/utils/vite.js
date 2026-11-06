/**
 * Runs Vite+ for the build, watch and start commands.
 *
 * Toolkit drives the `wp-vite` runner from `@10up/wp-vite-plugins`, which
 * runs the script pass and, when the project has Script Modules, the module
 * pass (`--mode modules`) into one `dist/`. Vite+ (`vp`) does the building.
 *
 * Without a `vite.config.*` in the project, toolkit passes its own config
 * (`config/vite.config.mjs`) and hands it the resolved toolkit config through
 * an environment variable, because `vp` runs in a child process that cannot
 * see toolkit's CLI flags.
 */
const path = require('path');
const { existsSync } = require('fs');

const { getArgFromCLI, hasArgInCLI } = require('./cli');
const { fromConfigRoot, hasProjectFile, fromProjectRoot } = require('./file');
const { getTenUpScriptsConfig, getTenUpScriptsPackageBuildConfig } = require('./config');

const VITE_CONFIG_FILES = [
	'vite.config.ts',
	'vite.config.mts',
	'vite.config.cts',
	'vite.config.js',
	'vite.config.mjs',
	'vite.config.cjs',
];

/** The env var `config/vite/index.mjs` reads the toolkit config from. */
const CONFIG_ENV = 'TENUP_TOOLKIT_CONFIG';

/** Does the project have its own Vite config? */
const hasViteConfig = () =>
	hasArgInCLI('--config') || VITE_CONFIG_FILES.some((file) => hasProjectFile(file));

/** Absolute path of the `vp` binary that ships with toolkit's `vite-plus`. */
const getVitePlusBin = () => {
	const vitePlusDir = path.dirname(require.resolve('vite-plus/package.json'));
	const bin = path.join(vitePlusDir, 'bin', 'vp');
	if (!existsSync(bin)) {
		throw new Error(`10up-toolkit: could not find the Vite+ binary at ${bin}`);
	}
	return bin;
};

/**
 * Absolute path of a binary that ships with `vite-plus` (`oxlint`, `oxfmt`).
 *
 * @param {string} packageName Package that declares the binary.
 * @param {string} [binName]   Binary name, when it differs from the package name.
 */
const getVitePlusToolBin = (packageName, binName = packageName) => {
	const vitePlusDir = path.dirname(require.resolve('vite-plus/package.json'));
	const packageJsonPath = require.resolve(`${packageName}/package.json`, {
		paths: [vitePlusDir],
	});
	const { bin } = require(packageJsonPath);
	const relativeBin = typeof bin === 'string' ? bin : bin[binName];
	return path.join(path.dirname(packageJsonPath), relativeBin);
};

/**
 * Resolve a package from the project, not from toolkit. Returns `null` when
 * the project does not install it.
 *
 * @param {string} request Module request, e.g. `eslint/package.json`.
 */
const resolveFromProject = (request) => {
	try {
		return require.resolve(request, { paths: [path.dirname(fromProjectRoot('package.json'))] });
	} catch {
		return null;
	}
};

/**
 * The toolkit config `config/vite/index.mjs` builds from, with every CLI flag
 * already applied.
 */
const getResolvedToolkitConfig = () => {
	const project = getTenUpScriptsConfig();
	const packageBuild = getTenUpScriptsPackageBuildConfig();

	return {
		project: {
			...project,
			// `--block-modules` (toolkit 7) turns on the module pass.
			useScriptModules: project.useScriptModules || hasArgInCLI('--block-modules'),
		},
		package: packageBuild && packageBuild.source && packageBuild.main ? packageBuild : false,
	};
};

/**
 * Should the runner do a module pass? A project config decides for itself
 * (`wp-vite` reads it); toolkit's own config has one when the project uses
 * Script Modules.
 */
const hasModulePass = (toolkitConfig) => {
	if (toolkitConfig.package) return false;
	const { project } = toolkitConfig;
	return Boolean(
		project.useScriptModules ||
		project.useBlockAssets ||
		Object.keys(project.moduleEntry ?? {}).length > 0,
	);
};

/** Extra Vite CLI arguments: anything after `--` on the toolkit command line. */
const getPassthroughArgs = () => {
	const args = process.argv.slice(2);
	const separator = args.indexOf('--');
	return separator === -1 ? [] : args.slice(separator + 1);
};

/**
 * Run `wp-vite build|watch|dev` for the current project.
 *
 * @param {'build' | 'watch' | 'dev'} command
 * @returns {Promise<number>} Exit code.
 */
const runVite = async (command) => {
	const toolkitConfig = getResolvedToolkitConfig();
	const ownConfig = hasViteConfig();
	const configArgs = ownConfig ? [] : ['--config', fromConfigRoot('vite.config.mjs')];

	if (!process.env.NODE_ENV) {
		process.env.NODE_ENV = command === 'build' ? 'production' : 'development';
	}

	const runner = await import(`@10up/wp-vite-plugins/${command}`);
	const run = runner[command];

	const port = getArgFromCLI('--port');
	const devArgs = command === 'dev' && port ? ['--port', String(port)] : [];

	const options = {
		cwd: path.dirname(fromProjectRoot('package.json')),
		bin: getVitePlusBin(),
		args: [...configArgs, ...devArgs, ...getPassthroughArgs()],
		env: ownConfig ? {} : { [CONFIG_ENV]: JSON.stringify(toolkitConfig) },
	};

	if (command !== 'dev' && !ownConfig) {
		options.modules = hasModulePass(toolkitConfig);
	}

	// A library build writes into whatever `main` names; don't wipe the directory.
	if (toolkitConfig.package) {
		options.clean = false;
	}

	return run(options);
};

module.exports = {
	CONFIG_ENV,
	VITE_CONFIG_FILES,
	getResolvedToolkitConfig,
	getVitePlusBin,
	getVitePlusToolBin,
	hasModulePass,
	resolveFromProject,
	hasViteConfig,
	runVite,
};
