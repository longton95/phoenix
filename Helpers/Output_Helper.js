'use strict';

const
	path = require('path'),
	fs = require('fs-extra'),
	moment = require('moment-timezone');

// Colours to be used in the console logging
const
	Red = '\x1b[31m',
	Grey = '\x1b[37m',
	Reset = '\x1b[0m',
	Green = '\x1b[32m',
	Yellow = '\x1b[33m';

class Output_Helper {
	/*****************************************************************************
	 * Writes a green done to the console and resolves the promise if passed
	 *
	 * @param {Function} done - Promise callback passed from the function
	 ****************************************************************************/
	static finish(done, value) {
		appendLog('basic', 'Done\n', false);
		if (!global.testing && global.logging === 'basic') {
			process.stdout.write(`${Green}Done${Reset}\n`);
		}

		if (done) {
			done(value);
		}
	}

	/*****************************************************************************
	 * Writes a yellow skip to the console and resolves the promise if passed
	 *
	 * @param {Function} done - Promise callback passed from the function
	 ****************************************************************************/
	static skip(done, value) {
		appendLog('basic', 'Skipping\n', false);
		if (!global.testing && global.logging === 'basic') {
			process.stdout.write(`${Yellow}Skipping${Reset}\n`);
		}

		if (done) {
			done(value);
		}
	}

	/*****************************************************************************
	 * Writes a message with a green info tag (note no new line is passed by
	 * default)
	 *
	 * @param {String} message - A string to be output after the info tag
	 ****************************************************************************/
	static info(message) {
		appendLog('basic', `[INFO] ${sanatise(message)}`, true);
		appendLog('debug', `[INFO] ${sanatise(message)}\n`, true);
		if (!global.testing) {
			if (global.logging === 'basic') {
				process.stdout.write(`${Green}[INFO]${Reset} ${message}`);
			} else {
				process.stdout.write(`${Green}[INFO]${Reset} ${message}\n`);
			}
		}
	}

	/*****************************************************************************
	 * Outputs all of a string in red
	 *
	 * @param {String} message - String to be output
	 ****************************************************************************/
	static error(message) {
		appendLog('basic', `\n[ERROR] ${sanatise(message)}\n`, true);
		appendLog('debug', `[ERROR] ${sanatise(message)}\n`, true);
		if (!global.testing) {
			if (global.logging === 'basic') {
				process.stdout.write(`\n${Red}[ERROR] ${message}${Reset}\n`);
			} else {
				process.stdout.write(`${Red}[ERROR] ${message}${Reset}\n`);
			}
		}
	}

	/*****************************************************************************
	 * Creates a banner and a green info tag around a message
	 *
	 * @param {String} message - String to be enclosed by the banner
	 ****************************************************************************/
	static banner(message) {
		appendLog('all', `\n############### ${message} ###############\n`, false);
		if (!global.testing) {
			process.stdout.write('\n-------------------------------------------------------\n');
			process.stdout.write(`${Green}[INFO]${Reset} ${message}\n`);
			process.stdout.write('-------------------------------------------------------\n');
		}
	}

	/*****************************************************************************
	 * Outputs a message when the debug flag is used
	 *
	 * @param {String} message - String to be output
	 ****************************************************************************/
	static debug(message, type) {
		appendLog(type, `[DEBUG] ${sanatise(message)}`, true);
		if (!global.testing && global.logging === 'debug') {
			process.stdout.write(`${Grey}[DEBUG] ${message}${Reset}`);
		}
	}

	/*****************************************************************************
	 * Append data into the log only
	 *
	 * @param {String} message - String to be output
	 ****************************************************************************/
	static log(message) {
		appendLog('all', `[LOG] ${sanatise(message)}\n`, true);
	}

	/*****************************************************************************
	 * Create the build directory if it doesn't exist. If it does, empty the
	 * contents of it ready for the next run
	 ****************************************************************************/
	static setupBuildDir() {
		if (!global.projRoot) {
			global.projRoot = '.';
		}

		const
			rootPath = path.join(global.projRoot, 'Build', `${global.hostOS}-${global.platformOS}`),
			appDir = path.join(rootPath, 'App'),
			moduleDir = path.join(rootPath, 'Module'),
			appLog = path.join(appDir, 'appc_new.log'),
			moduleLog = path.join(moduleDir, 'appc_new.log');

		fs.emptyDirSync(appDir);
		fs.emptyDirSync(moduleDir);

		fs.ensureFileSync(appLog);
		fs.ensureFileSync(moduleLog);
	}

	/*****************************************************************************
	 * Creates the logging records for a new run, setting up an overhead
	 * directory, containing a log of formatted data, and a log of debug data. It
	 * also creates a directory for storing any screenshots of failed tests.
	 ****************************************************************************/
	static setupLogDir(done) {
		if (!global.projRoot) {
			global.projRoot = '.';
		}
		// Generate a timestamp to be used on the current run
		global.timestamp = moment();

		// Allows us to know whether or not we should be logging to the files
		global.logFiles = true;

		// Build up the paths to the relevant files
		const
			logRoot = path.join(global.projRoot, 'Logs'),
			repRoot = path.join(global.projRoot, 'Reports'),

			logPath = path.join(logRoot, global.timestamp.format('DD-MM-YYYY_HH꞉mm꞉ss')),
			screenshots = path.join(logPath, 'Screen_Shots'),

			logBasicFile = path.join(logPath, 'basic.log'),
			logDebugFile = path.join(logPath, 'debug.log');

		try {
			// If the log directory doesn't exist then make it
			fs.ensureDirSync(logRoot);
			// If the report directory doesn't exist then make it
			fs.ensureDirSync(repRoot);
			// Create/Empty the JUnit report directory
			fs.emptyDirSync(repRoot);
			// Make the directory for storing all the data for this run
			fs.mkdirSync(logPath);
			// Create a directory to store the failure screenshots for this run
			fs.mkdirSync(screenshots);
			// Create an empty file for the basic logging output
			fs.ensureFileSync(logBasicFile);
			// Create an empty file for the debug logging output
			fs.ensureFileSync(logDebugFile);

			done();
		} catch (err) {
			// If a log file already exists we don't need a new one
			if (err.code !== 'EEXIST') {
				done(err.code);
			}
		}
	}
}

/*******************************************************************************
 * Write a message into one or both logs depending on the type of message that
 * needs to be written.
 *
 * @param {String} type - The type of logging that the message is for
 * @param {String} message - The string to write to the relevant log file
 * @param {Boolean} time - A bool value for whether a timestamp should be added
 ******************************************************************************/
function appendLog(type, message, time) {
	if (global.logFiles) {
		const
			logBasicFile = path.join(global.projRoot, 'Logs', global.timestamp.format('DD-MM-YYYY_HH꞉mm꞉ss'), 'basic.log'),
			logDebugFile = path.join(global.projRoot, 'Logs', global.timestamp.format('DD-MM-YYYY_HH꞉mm꞉ss'), 'debug.log');

		if (time) {
			const currTime = moment().format('HH꞉mm');
			message = `[${currTime}] ${message}`;
		}

		try {
			// Append to the relevant log depending on the type of message
			switch (type) {
				case 'all':
					fs.appendFileSync(logBasicFile, message);
					fs.appendFileSync(logDebugFile, message);
					break;

				case 'basic':
					fs.appendFileSync(logBasicFile, message);
					break;

				case 'debug':
					fs.appendFileSync(logDebugFile, message);
					break;
			}
		} catch (err) {
			// Do Nothing
		}
	}
}

function sanatise(message) {
	if (message instanceof Object) {
		if (message instanceof Buffer) {
			return message.toString('utf8');
		} else {
			return JSON.stringify(message, null, 2);
		}
	} else {
		return message;
	}
}

module.exports = Output_Helper;
