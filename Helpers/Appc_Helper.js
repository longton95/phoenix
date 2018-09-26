'use strict';

const
	path = require('path'),
	fs = require('fs-extra'),
	exec = require('child_process').execSync,
	spawn = require('child_process').spawn,
	Output = require('./Output_Helper.js'),
	exec = require('child_process').execSync,
	app = require('../Config/Test_Config.js').app,
	mod = require('../Config/Test_Config.js').mod,
	iOS = require('../Config/Test_Config.js').ios,
	appc = require('../Config/Credentials.js').appc,
	Android = require('../Config/Test_Config.js').android;

class Appc_Helper {
	/*****************************************************************************
	 * Take the passed SDK, and attempt to install it. If it is a straight defined
	 * SDK, then install it. Otherwise if it is a branch, get the latest version
	 * of it
	 *
	 * @param {String} requestedSDK - The SDK version desired for testing
	 ****************************************************************************/
	static installSDK(requestedSDK) {
		return new Promise((resolve, reject) => {
			let
				sdk,
				cmd = 'appc',
				args = [ 'ti', 'sdk', 'install', '-b', requestedSDK, '-d', '--no-prompt', '--username', appc.username, '--password', appc.password ],
				error = false;

			let
				foundStr,
				installStr = /Titanium SDK \w+\.\w+\.\w+\.\w+ successfully installed!/;

			if ((requestedSDK.split('.')).length > 1) {
				Output.info(`Installing Titanium SDK '${requestedSDK}'... `);

				foundStr = /Titanium SDK \w+\.\w+\.\w+\.\w+ is already installed!/;

				// Remove the branch flag if downloading a specific SDK
				let index = args.indexOf(args.find(element => element === '-b'));

				args.splice(index, 1);
			} else {
				Output.info(`Installing Titanium SDK From '${requestedSDK}'... `);

				foundStr = /You're up-to-date\. Version \w+\.\w+\.\w+\.\w+ is currently the newest version available\./;
			}

			const prc = spawn(cmd, args);
			prc.stdout.on('data', data => {
				Output.debug(data, 'debug');
				if (data.toString().match(installStr)) {
					sdk = data.toString().match(/\w+\.\w+\.\w+\.\w+/)[0];
				}
				if (data.toString().match(foundStr)) {
					sdk = data.toString().match(/\w+\.\w+\.\w+\.\w+/)[0];
				}
			});
			prc.stderr.on('data', data => {
				Output.debug(data, 'debug');
				// Appc CLI doesn't provide an error code on fail, so need to monitor the output and look for issues manully
				// If statement is there so that [WARN] flags are ignored on stderr
				if (data.toString().includes('[ERROR]')) {
					error = true;
				}
			});
			prc.on('exit', code => {
				if (code !== 0 || error === true) {
					reject('Error installing Titanium SDK');
				} else {
					// If the SDK was already installed, the -d flag will have been ignored
					exec(`appc ti sdk select ${sdk}`);

					Output.finish(resolve, sdk);
				}
			});
		});
	}

	/*****************************************************************************
	 * Install the latest version of the required CLI version for testing
	 *
	 * @param {String} version - The CLI version being tested
	 ****************************************************************************/
	static async installCLI(version) {
		Output.info(`Installing CLI Version '${version}'... `);
		try {
			exec(`appc use ${version}`, {
				stdio: [ 0 ]
			});
		} catch (err) {
			if (err.toString().includes(`The version specified ${version} was not found`)) {
				// Go to the pre-production environment
				Output.log('Logging Out of the Appc CLI');
				exec('appc logout');

				Output.log('Setting Environment to PreProduction');
				exec('appc config set defaultEnvironment preproduction');

				Output.log('Logging In');
				exec(`APPC_ENV=preproduction appc login --no-prompt --username ${appc.username} --password ${appc.password}`);

				// Check if the CLI version we want to use is installed
				Output.log(`Checking if the Latest Version of ${version} is Installed`);
				const
					clis = JSON.parse(exec('appc use -o json --prerelease')),
					latest = clis.versions.find(element => element.includes(version)),
					installed = clis.installed.includes(latest);

				if (!latest) {
					throw (new Error(`No Version Found For CLI ${version}`));
				}

				// If not, install it and set it as default
				if (installed) {
					Output.log(`Latest Already Installed, Selecting ${latest}`);
				} else {
					Output.log(`Latest Not Installed, Downloading ${latest}`);
				}

				exec(`appc use ${latest}`);

				// Return to the production environment
				Output.log('Logging Out of the Appc CLI');
				exec('appc logout');

				Output.log('Setting Environment to Production');
				exec('appc config set defaultEnvironment production');

				Output.log('Logging In');
				exec(`APPC_ENV=production appc login --no-prompt --username ${appc.username} --password ${appc.password}`);
			}
		}

		Output.finish();
	}

	/*****************************************************************************
	 * Creates the application
	 *
	 * We check if there is already an application in the specified folder
	 * Apps/<OS>-<Platform> and wipe the directory, the log file is created to
	 * track the output of the Appc CLI
	 ****************************************************************************/
	static newApp() {
		return new Promise((resolve, reject) => {
			Output.info('Generating New App... ');

			const
				rootPath = this.genRootPath('App'),
				logFile = path.join(rootPath, '..', 'appc_new.log');

			let
				cmd = 'appc',
				error = false,
				args = [ 'new', '-n', app.name, '--id', app.packageName, '-t', 'app', '-d', rootPath, '-q', '--no-banner', '--no-prompt', '--username', appc.username, '--password', appc.password, '-O', appc.org ];

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
	 * Creates the module
	 *
	 * We check if there is already an module in the specified folder
	 * Apps/<OS>-<Platform> and wipe the directory, the log file is created to
	 * track the output of the Appc CLI
	 ****************************************************************************/
	static newModule() {
		return new Promise((resolve, reject) => {
			Output.info('Generating New Module... ');

			const
				rootPath = this.genRootPath('Module'),
				logFile = path.join(rootPath, '..', 'appc_new.log');

			let
				cmd = 'appc',
				error = false,
				args = [ 'new', '-n', mod.name, '--id', mod.packageName, '-t', 'timodule', '-d', rootPath, '-q', '--no-banner', '--no-prompt', '--username', appc.username, '--password', appc.password, '-O', appc.org ];

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
	 * Checks that the application has been created successfully
	 ****************************************************************************/
	static checkGeneratedApp() {
		const
			rootPath = this.genRootPath('App'),
			logPath = path.join(rootPath, '..', 'appc_new.log');

		if (fs.existsSync(logPath)) {
			let data = fs.readFileSync(logPath, 'utf-8');

			const generated = data.includes('Project created successfully in') && data.includes('*** new completed. ***');

			return generated;
		} else {
			return false;
		}
	}

	/*****************************************************************************
	 * Checks that the module has been created successfully
	 ****************************************************************************/
	static checkGeneratedModule() {
		const
			rootPath = this.genRootPath('Module'),
			logPath = path.join(rootPath, '..', 'appc_new.log');

		if (fs.existsSync(logPath)) {
			let data = fs.readFileSync(logPath, 'utf-8');

			const generated = data.includes('Project created successfully in') && data.includes('*** new completed. ***');

			return generated;
		} else {
			return false;
		}
	}

	/*****************************************************************************
	 * Builds the required application
	 *
	 * [FIXME]: Had to remove the error listner in the build step due to an error
	 *					being thrown for not having crash analytics enabled. Either remove
	 *					it from the capability of all apps to be tested, or find a way to
	 *					build with no services that doesn't throw an error at runtime.
	 ****************************************************************************/
	static buildApp() {
		return new Promise((resolve, reject) => {
			Output.info('Building Application... ');

			let error = false,
				rootPath = this.genRootPath('App');

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
	 * Builds the application with liveview enabled
	 ****************************************************************************/
	static buildLiveviewApp() {
		return new Promise((resolve, reject) => {
			Output.info('Building Application... ');

			let rootPath = this.genRootPath('App');

			let
				cmd = 'appc',
				args = [ 'run', '--platform', global.platformOS.toLowerCase(), '-d', rootPath, '-f', '--no-prompt', '--liveview' ];

			if (global.platformOS === 'iOS') {
				let simUDID = exec(`instruments -s devices | grep "${iOS.deviceName} (${iOS.platVersion}) \\["`).toString().match(/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/)[0];
				args.push('-C', simUDID, '-I', iOS.platVersion);
			}
			if (global.platformOS === 'Android') {
				args.push('-C', Android.deviceName, '--deploy-type', 'development');
			}

			const prc = spawn(cmd, args);
			prc.stdout.on('data', data => {
				Output.debug(data, 'debug');
				const line = data.toString().trim();

				const
					regStr = 'Client connected',
					isLaunched = new RegExp(regStr, 'g').test(line);

				if (isLaunched) {
					Output.finish(resolve, null);
				}
			});
			prc.stderr.on('data', data => {
				Output.debug(data, 'debug');
			});
			prc.on('exit', code => {
				reject('Failed on application build')
			});
		});
	}

	/*****************************************************************************
	 * Builds the required Module
	 ****************************************************************************/
	static buildModule() {
		return new Promise((resolve, reject) => {
			Output.info('Building Module... ');

			let
				error = false,
				rootPath = path.join(this.genRootPath('Module'), global.platformOS.toLowerCase());

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
	static checkBuiltApp() {
		let log;

		if (global.platformOS === 'iOS') {
			log = 'iphone';
		}

		if (global.platformOS === 'Android') {
			log = 'android';
		}

		let
			appPath = this.genAppPath(),
			rootPath = this.genRootPath('App'),
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

	/*****************************************************************************
	 * See if there is already a built module in the module folder.
	 * If one does exist, then check the module zip file has been generated.
	 ****************************************************************************/
	static checkBuiltModule() {
		let platform = global.platformOS.toLowerCase();

		const
			rootPath = this.genRootPath('Module'),
			zipPath = (platform === 'ios') ? path.join(rootPath, platform, 'dist', `${mod.packageName}-iphone-1.0.0.zip`) : path.join(rootPath, platform, 'dist', `${mod.packageName}-${platform}-1.0.0.zip`);

		return fs.existsSync(zipPath);
	}

	/*****************************************************************************
	 * Build a path to the location of the built app, dependant on platform
	 ****************************************************************************/
	static genAppPath() {
		let
			appPath,
			rootPath = this.genRootPath('App');

		if (global.platformOS === 'iOS') {
			appPath = path.join(rootPath, 'build', 'iphone', 'build', 'Products', 'Debug-iphonesimulator', `${app.name}.app`);
		} else if (global.platformOS === 'Android') {
			appPath = path.join(rootPath, 'build', 'android', 'bin', `${app.name}.apk`);
		}

		return appPath;
	}

	/*******************************************************************************
	 * Generate a path to the root of the application directory
	 ******************************************************************************/
	static genRootPath(type) {
		let file;

		if (type === 'App') {
			file = app.name;
		} else if (type === 'Module') {
			file = mod.name;
		}

		return path.join(global.projRoot, 'Build', `${global.hostOS}-${global.platformOS}`, type, file);
	}
}

module.exports = Appc_Helper;
