// Improved bounce rate calculation
module.exports.calculateBounceRate = function (singlePageSessions, totalSessions) {
	console.log({ singlePageSessions, totalSessions });

	return totalSessions > 0 ? Math.floor((singlePageSessions / totalSessions) * 100) : 0;
};
