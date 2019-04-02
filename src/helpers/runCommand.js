const utils = require("../utils");

const runCommand = ({
	args,
	showOutput = true,
	logMessage,
	spinner,
	repo,
	failHelpKey = "gitCommandFailed",
	exitOnFail = false,
	showError = true,
	fullCommand = false,
	maxBuffer,
	onError
}) => {
	const command = fullCommand ? `${args}` : `git ${args}`;

	if (spinner) {
		const action = logMessage || command;
		spinner.text = `${repo}: ${action}`;
	}

	if (!showOutput || process.env.NO_OUTPUT) {
		return utils.exec(command, maxBuffer ? maxBuffer : undefined);
	}

	if (onError === undefined) {
		onError = err => {
			utils.advise(failHelpKey, { exit: exitOnFail });

			return showError
				? () => Promise.reject(err)
				: () => Promise.reject();
		};
	}

	utils.log.begin(logMessage || command);
	return utils
		.exec(command, maxBuffer ? maxBuffer : undefined)
		.then(result => {
			utils.log.end();
			return Promise.resolve(result);
		})
		.catch(err => {
			utils.log.end();
			return onError(err)();
		});
};

module.exports = runCommand;
