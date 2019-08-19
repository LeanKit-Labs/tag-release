const util = require("../utils");

const getContentsFromYAML = (path, code) => {
	const filePath = `${path}/${code}.yaml`;
	let contents = util.readYAMLFile(filePath);
	let keys = Object.keys(contents);
	if (keys.length === 1 && keys[0] === code) {
		keys = Object.keys(contents[code]);
		contents = util.readYAMLFile(filePath)[code];
	}
	return contents;
};

module.exports = getContentsFromYAML;
