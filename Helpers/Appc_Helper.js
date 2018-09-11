'use strict';

const
	path = require('path'),
	fs = require('fs-extra'),
	spawn = require('child_process').spawn,
	Output = require('./Output_Helper.js'),
	app = require('../Config/Test_Config.js').app,
	appc = require('../Config/Credentials.js').appc;

class Appc_Helper {

	static newProject() {
		return new Promise((resolve, reject) => {
			Output.info('Generating New Project... ');

			const
				rootPath = genRootPath(),
				projectDir = path.join(rootPath, '..'),
				logFile = path.join(projectDir, 'appc_new.log');

			fs.emptyDirSync(projectDir);

			fs.ensureFileSync(logFile);

			let
				cmd = 'appc',
				error = false,
				args = [ 'new', '-n', app.appName, '--id', app.packageName, '-t', 'app', '-d', rootPath, '-q', '--no-banner', '--no-prompt', '--username', appc.username, '--password', appc.password, '-O', appc.org ];

			const prc = spawn(cmd, args);
			prc.stdout.on('data', data => {
				Output.debug(data, 'debug');
				fs.appendFileSync(logFile, data);
			});
			prc.stderr.on('data', data => {
				Output.debug(data, 'debug');
				fs.appendFileSync(logFile, data);
				// Appc CLI doesn't provide an error code on fail, so need to monitor the output and look for issues manully
				// If statement is there so that [WARN] flags are ignored on stderr
				if (data.toString().includes('[ERROR]')) {
					error = true;
				}
			});
			prc.on('exit', code => {
				(code !== 0 || error === true) ? reject('Failed on appc new') : Output.finish(resolve, null);
			});
		});
	}

	/*****************************************************************************
	 * Builds the required application
	 *
	 * @param {String} platform - The OS that the app will be built for
	 *
	 * [FIXME]: Had to remove the error listner in the build step due to an error
	 *					being thrown for not having crash analytics enabled. Either remove
	 *					it from the capability of all apps to be tested, or find a way to
	 *					build with no services that doesn't throw an error at runtime.
	 ****************************************************************************/
	static buildApp() {
		return new Promise((resolve, reject) => {
			Output.info('Building Application... ');

			let
				error = false,
				rootPath = genRootPath();

			let
				cmd = 'appc',
				args = [ 'run', '--build-only', '--platform', global.platformOS.toLowerCase(), '-d', rootPath, '-f', '--no-prompt' ];

			const prc = spawn(cmd, args);
			prc.stdout.on('data', data => {
				Output.debug(data, 'debug');
			});
			prc.stderr.on('data', data => {
				Output.debug(data, 'debug');
				// Appc CLI doesn't provide an error code on fail, so need to monitor the output and look for issues manully
				// If statement is there so that [WARN] flags are ignored on stderr
				// if(data.toString().includes('[ERROR]')) error = true;
			});
			prc.on('exit', code => {
				(code !== 0 || error === true) ? reject('Failed on application build') : Output.finish(resolve, null);
			});
		});
	}

	/*****************************************************************************
	 * See if there is already a built application in the application folder.
	 * If one does exist, then check the build log to make sure that the last
	 * build was succesful.
	 ****************************************************************************/
	static checkBuilt() {
		let log;

		if (global.platformOS === 'iOS') {
			log = 'iphone';
		}

		if (global.platformOS === 'Android') {
			log = 'android';
		}

		let
			appPath = this.genAppPath(),
			rootPath = genRootPath(),
			logPath = path.join(rootPath, 'build', `build_${log}.log`);

		if (fs.existsSync(appPath) && fs.existsSync(logPath)) {
			// If the application exists, check that it was a successful build from the log
			let data = fs.readFileSync(logPath, 'utf-8');

			const
				lines = data.trim().split('\n'),
				lastLine = lines.slice(-1)[0];

			data = data.replace(/ /g, '');

			const built = lastLine.includes('Project built successfully');

			return built;
		} else {
			return false;
		}
	}

	static checkGenerated() {
		const
			rootPath = genRootPath(),
			logPath = path.join(rootPath, '..', 'appc_new.log');

		if (fs.existsSync(logPath)) {
			let data = fs.readFileSync(logPath, 'utf-8');

			const generated = data.includes('Project created successfully in') && data.includes('*** new completed. ***');

			return generated;
		} else {
			return false;
		}
	}

	/*******************************************************************************
	 * Build a path to the location of the built app, dependant on platform
	 ******************************************************************************/
	static genAppPath() {
		let
			appPath,
			rootPath = genRootPath();

		if (global.platformOS === 'iOS') {
			appPath = path.join(rootPath, 'build', 'iphone', 'build', 'Products', 'Debug-iphonesimulator', `${app.appName}.app`);
		} else if (global.platformOS === 'Android') {
			appPath = path.join(rootPath, 'build', 'android', 'bin', `${app.appName}.apk`);
		}

		return appPath;
	}
}

function genRootPath() {
	return path.join(global.projRoot, 'Apps', `${global.hostOS}-${global.platformOS}`, app.appName);
}

module.exports = Appc_Helper;
