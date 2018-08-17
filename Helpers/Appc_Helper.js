'use strict';

const
	path = require('path'),
	fs = require('fs-extra'),
	spawn = require('child_process').spawn,
	Output = require('./Output_Helper.js');

class Appc_Helper {
	/*****************************************************************************
	 * Builds the required application
	 *
	 * @param {String} appName - The name of the application being built
	 * @param {String} platform - The OS that the app will be built for
	 *
	 * [FIXME]: Had to remove the error listner in the build step due to an error
	 *					being thrown for not having crash analytics enabled. Either remove
	 *					it from the capability of all apps to be tested, or find a way to
	 *					build with no services that doesn't throw an error at runtime.
	 ****************************************************************************/
	static buildApp(appName, platform) {
		return new Promise((resolve, reject) => {
			Output.info('Building Application... ');

			let
				error = false,
				rootPath = path.join(global.workspace, appName);

			let
				cmd = 'appc',
				args = [ 'run', '--build-only', '--platform', platform.toLowerCase(), '-d', rootPath, '-f', '--no-prompt' ];

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
	 * Return a path to the built application
	 *
	 * @param {String} appName - The name of the application being built
	 * @param {String} platform - The OS that the app will be built for
	 ****************************************************************************/
	static getAppPath(appName, platform) {
		return genAppPath(appName, platform);
	}

	/*****************************************************************************
	 * See if there is already a built application in the application folder.
	 * If one does exist, then check the build log to make sure that the last
	 * build was succesful.
	 *
	 * @param {String} appName - The name of the application being built
	 * @param {String} platform - The OS that the app will be built for
	 ****************************************************************************/
	static checkBuilt(appName, platform) {
		let log;

		if (platform === 'iOS') {
			log = 'iphone';
		}

		if (platform === 'Android') {
			log = 'android';
		}

		let
			rootPath = path.join(global.workspace, appName),
			appPath = genAppPath(appName, platform),
			logPath = `${rootPath}/build/build_${log}.log`;

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
}

/*******************************************************************************
 * Build a path to the location of the built app, dependant on platform
 *
 * @param {String} appName - The name of the application being built
 * @param {String} platform - The OS that the app will be built for
 ******************************************************************************/
function genAppPath(appName, platform) {
	let
		appPath,
		rootPath = path.join(global.workspace, appName);

	if (platform === 'iOS') {
		appPath = path.join(rootPath, 'build', 'iphone', 'build', 'Products', 'Debug-iphonesimulator', `${appName}.app`);
	} else if (platform === 'Android') {
		appPath = path.join(rootPath, 'build', 'android', 'bin', `${appName}.apk`);
	}

	return appPath;
}

module.exports = Appc_Helper;
