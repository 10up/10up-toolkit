/**
 * Display rspack/webpack build stats.
 *
 * Kept as `displayWebpackStats` for backward compatibility with
 * any consumers that import it by name, but works identically with rspack stats.
 */
const displayWebpackStats = (err, stats) => {
	if (err) {
		console.error(err.stack || err);
		if (err.details) {
			console.error(err.details);
		}
		return;
	}

	process.stdout.write(`${stats.toString({ colors: true })}\n`);
};

// Also export under the new name for new code
const displayBuildStats = displayWebpackStats;

module.exports = {
	displayWebpackStats,
	displayBuildStats,
};
