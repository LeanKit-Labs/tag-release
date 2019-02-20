#!/usr/bin/env node
const editor = require("editor");
const utils = require("../src/utils");

process.chdir(process.env.TR_DIRECTORY);

const path = "./.tag-releaserc.json";
return new Promise((resolve, reject) => {
	editor(path, code => {
		if (code === 0) {
			const contents = utils.readFile(path);
			resolve(contents);
		} else {
			reject(`Unable to edit ${path}`);
		}
	});
});
