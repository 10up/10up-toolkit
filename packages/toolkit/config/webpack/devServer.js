const path = require('path');

module.exports = ({ projectConfig: { devServer, devServerPort } }) => {
	if (!devServer) {
		return undefined;
	}

	return {
		contentBase: path.join(__dirname, 'public'),
		compress: true,
		port: Number(devServerPort),
	};
};
