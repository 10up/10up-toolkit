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

module.exports = {
	displayWebpackStats,
};
