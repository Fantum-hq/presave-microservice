const fs = require('fs');
const path = require('path');

let instance;
class CacheStorage {
	constructor() {
		if (instance) {
			throw new Error('this instance already exists');
		}
		instance = this;
		this.filepath = path.join(__dirname, './log.json');
	}

	async get() {
		const fileContent = await fs.promises.readFile(this.filepath, 'utf8');
		if (!fileContent) {
			await fs.promises.mkdir(path.dirname(this.filepath), {
				recursive: true,
			});
			return {};
		}
		return JSON.parse(fileContent) || {};
	}

	async set(data) {
		await fs.promises.mkdir(path.dirname(this.filepath), {
			recursive: true,
		});
		await fs.promises.writeFile(this.filepath, JSON.stringify(data, null, 2));
	}

	async clear() {
		await fs.promises.writeFile(this.filepath, '{}');
	}
}

const cacheInstance = new CacheStorage();

module.exports = { cacheInstance };
