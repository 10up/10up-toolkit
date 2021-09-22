module.exports = ({ isPackage, projectConfig: { devServer, devServerPort } }) => {
	if (!devServer || !isPackage) {
		return undefined;
	}

	return {
		open: false,
		contentBase: 'public',
		compress: true,
		port: Number(devServerPort),
	};
};
