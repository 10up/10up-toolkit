const spawn = require('cross-spawn');
const { sync: resolveBin } = require('resolve-bin');

const dependencies = ['cross-spawn', 'webpack', 'webpack-dev-server', 'mini-css-extract-plugin'];

dependencies.forEach((dep) => {
	spawn(
		resolveBin('@vercel/ncc', { executable: 'ncc' }),
		['build', require.resolve(dep), '-o', `compiled/${dep}`, '--minify'],
		{
			stdio: 'inherit',
		},
	);
});
