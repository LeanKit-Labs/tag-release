const sequence = require("when/sequence");
const Table = require("cli-table2");
const path = require("path");
const fs = require("fs");

const logErrorToFile = (options, error) => {
	const logPath = path.join(__dirname, "../../.log.txt");
	const content = `${new Date().toLocaleString()}
	version: ${options.version}
	command: ${options.command}
	step: ${options.step}
	error: ${error.message}\n\n`;
	fs.appendFileSync(logPath, content);
};

const runWorkflow = (workflow, options) => {
	return sequence(workflow, options)
		.then(() => options.callback(options))
		.catch(error => {
			const table = new Table();
			table.push(
				["version", options.version],
				["command", options.command],
				["step", options.step],
				["error", error.message]
			);
			logErrorToFile(options, error);
			console.log(`\nTag-release encountered a problem:`); // eslint-disable-line no-console
			console.log(table.toString()); // eslint-disable-line no-console
		});
};

module.exports = runWorkflow;
