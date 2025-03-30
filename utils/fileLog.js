const fs = require('fs');
const path = require('path');
const FileLog = data => {
	const timestamp = new Date()
		.toLocaleString('en-GB', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			hour12: true,
		})
		.replace(/,/, '')
		.replace(/\//g, '-');

	const filePath = path.join(__dirname, '../logs/', `${timestamp}.json`);
	if (Object.keys(data).length !== 0) {
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
	}
};
const FileLog2 = (data, id) => {
	const filePath = path.join(__dirname, '../insights/', `insight-${id}.json`);
	if (Object.keys(data).length !== 0) {
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
	}
};

module.exports = { FileLog, FileLog2 };
