module.exports.formatDateMMDD = function (timestamp) {
	const date = new Date(timestamp);
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: '2-digit',
	});
};
