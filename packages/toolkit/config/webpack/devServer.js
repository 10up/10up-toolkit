const path = require('path');

module.exports = ({ isPackage, projectConfig: { devServer, devServerPort } }) => {
	if (!devServer || !isPackage) {
		return undefined;
	}

	return {
		contentBase: path.join(__dirname, 'public'),
		compress: true,
		port: Number(devServerPort),
	};
};
