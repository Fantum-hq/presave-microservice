const moment = require('moment-timezone');
function getDelay({
	releaseDate,
	FanTimeZone = undefined,
	CreatorsTimeZone,
	releaseType,
}) {
	console.log({ releaseDate, releaseType });

	const rd = releaseDate; // '01/18/2025, 14:08';
	const ftz = FanTimeZone; // 'Africa/Lagos';
	const ctz = CreatorsTimeZone; // 'Africa/Lagos';
	const type = releaseType; // 'local';

	const typeLocal = 'local';
	const typeGlobal = 'global';

	if (!type) {
		throw new Error('no release type');
	}

	let userInLocal;
	if (!ftz) {
		userInLocal = moment.tz(rd, 'MM/DD/YYYY, HH:mm', ctz);
	} else if (type == typeLocal) {
		userInLocal = moment.tz(rd, 'MM/DD/YYYY, HH:mm', ftz);
	} else if (type == typeGlobal) {
		userInLocal = moment.tz(rd, 'MM/DD/YYYY, HH:mm', ctz);
	}

	const userInUTC = userInLocal;
	const nowInUTC = moment().utc();

	const delay = userInUTC.diff(nowInUTC);
	return delay;
}

module.exports = { getDelay };
// 'local' means any fan that presaves
// will recieve a library update in their local time

// 'global' means any fan that presaves
// will receive a library update in the creators local time

// On creation
// presave stored in db
//
// assuming relTime = 16:00 today
// if set to global
//
