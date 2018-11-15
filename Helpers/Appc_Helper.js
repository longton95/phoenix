'use strict';

const
	path = require('path'),
	fs = require('fs-extra'),
	ioslib = require('ioslib'),
	spawn = require('child_process').spawn,
	Output = require('./Output_Helper.js'),
	exec = require('child_process').execSync,
	testConf = require('../Config/Test_Config.js'),
	credentials = require('../Config/credentials.js');

const
	appc = credentials.appc,

	app = testConf.app,
	mod = testConf.mod,
	keystore = credentials.keystore,

	testDevices = {
		emulator: testConf.emulator,
		simulator: testConf.simulator,
		iosDevice: testConf.iosDevice,
		genymotion: testConf.genymotion,
		androidDevice: testConf.androidDevice
	};

class Appc_Helper {
	/*****************************************************************************
	 * Take the passed SDK, and attempt to install it. If it is a straight defined
	 * SDK, then install it. Otherwise if it is a branch, get the latest version
	 * of it
	 ****************************************************************************/
	static installSDK() {
		return new Promise((resolve, reject) => {
			let
				sdk,
				cmd = 'appc',
				args = [ 'ti', 'sdk', 'install', '-b', global.appcSDK, '-d', '--no-prompt', '--username', appc.username, '--password', appc.password, '-O', appc.org ],
				error = false;

			let
				foundStr,
				installStr = /Titanium SDK \w+\.\w+\.\w+\.\w+ successfully installed!/;

			if ((global.appcSDK.split('.')).length > 1) {
				Output.info(`Installing Titanium SDK '${global.appcSDK}'... `);

				foundStr = /Titanium SDK \w+\.\w+\.\w+\.\w+ is already installed!/;

				// Remove the branch flag if downloading a specific SDK
				let index = args.indexOf(args.find(element => element === '-b'));

				args.splice(index, 1);
			} else {
				Output.info(`Installing Titanium SDK From '${global.appcSDK}'... `);

				foundStr = /You're up-to-date\. Version \w+\.\w+\.\w+\.\w+ is currently the newest version available\./;
			}

			const prc = spawn(cmd, args, {
				shell: true
			});
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
				// Appc CLI doesn't provide an error code on fail, so need to monitor the output and look for issues manually
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
	 ****************************************************************************/
	static async installCLI() {
		Output.info(`Installing CLI Version '${global.appcCLI}'... `);
		try {
			exec(`appc use ${global.appcCLI}`, {
				stdio: [ 0 ]
			});
		} catch (err) {
			if (err.toString().includes(`The version specified ${global.appcCLI} was not found`)) {
				// Go to the pre-production environment
				Output.log('Logging Out of the Appc CLI');
				exec('appc logout');

				Output.log('Setting Environment to PreProduction');
				exec('appc config set defaultEnvironment preproduction');

				Output.log('Logging In');
				exec(`APPC_ENV=preproduction appc login --no-prompt --username ${appc.username} --password ${appc.password}`);

				// Check if the CLI version we want to use is installed
				Output.log(`Checking if the Latest Version of ${global.appcCLI} is Installed`);
				const
					clis = JSON.parse(exec('appc use -o json --prerelease')),
					latest = clis.versions.find(element => element.includes(global.appcCLI)),
					installed = clis.installed.includes(latest);

				if (!latest) {
					throw (new Error(`No Version Found For CLI ${global.appcCLI}`));
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

			const prc = spawn(cmd, args, {
				shell: true
			});

			prc.stdout.on('data', data => {
				Output.debug(data, 'debug');
				fs.appendFileSync(logFile, data);
			});

			prc.stderr.on('data', data => {
				Output.debug(data, 'debug');
				fs.appendFileSync(logFile, data);
				// Appc CLI doesn't provide an error code on fail, so need to monitor the output and look for issues manually
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

			const prc = spawn(cmd, args, {
				shell: true
			});
			prc.stdout.on('data', data => {
				Output.debug(data, 'debug');
				fs.appendFileSync(logFile, data);
			});
			prc.stderr.on('data', data => {
				Output.debug(data, 'debug');
				fs.appendFileSync(logFile, data);
				// Appc CLI doesn't provide an error code on fail, so need to monitor the output and look for issues manually
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
			logPath = path.join(rootPath, '..', 'appc_new.log'),
			filePath = path.join(rootPath, 'tiapp.xml');

		let error = false;

		if (fs.existsSync(logPath)) {
			let data = fs.readFileSync(logPath, 'utf-8'),
				tiapp = require('tiapp.xml').load(filePath);
			// Checks if Tiapp and specified SDK matches
			if (tiapp.sdkVersion !== global.appcSDK) {
				error = true;
				Output.error('SDK specified and SDK in Tiapp.xml do not match');
			}
			let modules = tiapp.getModules();
			// TODO: Add windows wantedModules.
			const wantedModules = [
				{ id: 'com.soasta.touchtest', platform: 'iphone' },
				{ id: 'com.soasta.touchtest', platform: 'android' },
				{ id: 'ti.cloud', platform: 'commonjs' },
				{ id: 'com.appcelerator.apm', platform: 'android' },
				{ id: 'com.appcelerator.apm', platform: 'iphone' },
				{ id: 'hyperloop', platform: 'iphone' },
				{ id: 'hyperloop', platform: 'android' }
			];

			try {
				require('chai').expect(modules).to.have.deep.members(wantedModules);
			} catch (expected) {
				error = true;
				Output.error(expected);
			}

			const generated = data.includes('Project created successfully in') && data.includes('*** new completed. ***');

			if (generated && !error) {
				return true;
			}
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
	 * [FIXME]: Had to remove the error listener in the build step due to an error
	 *					being thrown for not having crash analytics enabled. Either remove
	 *					it from the capability of all apps to be tested, or find a way to
	 *					build with no services that doesn't throw an error at runtime.
	 ****************************************************************************/
	static buildApp(platform) {
		return new Promise(async (resolve, reject) => {
			Output.info('Building Application... ');

			let error = false,
				rootPath = this.genRootPath('App');

			let
				cmd = 'appc',
				args = [ 'run', '--build-only', '--platform', global.platformOS.toLowerCase(), '-d', rootPath, '-f', '--no-prompt', '--username', appc.username, '--password', appc.password, '-O', appc.org ];

			switch (platform) {
				case 'iosDevice':
					args.push('-V', await getCert(), '-P', await getUUID());

				case 'androidDevice':
					args.push('-T', 'device');
					break;

				case 'simulator':
					args.push('-T', 'simulator');
					break;

				case 'emulator':
				case 'genymotion':
					args.push('-T', 'emulator');
					break;
			}

			const prc = spawn(cmd, args, {
				shell: true
			});
			prc.stdout.on('data', data => {
				Output.debug(data, 'debug');
			});
			prc.stderr.on('data', data => {
				Output.debug(data, 'debug');
				// Appc CLI doesn't provide an error code on fail, so need to monitor the output and look for issues manually
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
	static buildLiveviewApp(platform) {
		return new Promise(async (resolve, reject) => {
			Output.info('Building Application... ');

			let rootPath = this.genRootPath('App');

			let
				cmd = 'appc',
				args = [ 'run', '--platform', global.platformOS.toLowerCase(), '-d', rootPath, '-f', '--no-prompt', '--liveview', '--username', appc.username, '--password', appc.password, '-O', appc.org ];

			const testdevice = testDevices[platform];

			switch (platform) {
				case 'iosDevice':
					args.push('-V', await getCert(), '-P', await getUUID(), '-T', 'device', '-C', testdevice.udid, '-I', testdevice.platVersion);
					break;

				case 'simulator':
					let simUDID = exec(`instruments -s devices | grep "${testdevice.deviceName} (${testdevice.platVersion}) \\["`).toString().match(/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/)[0];
					args.push('-T', 'simulator', '-C', simUDID, '-I', testdevice.platVersion);
					break;

				case 'androidDevice':
					args.push('-T', 'device', '-C', testdevice.deviceId, '--deploy-type', 'development');
					break;

				case 'emulator':
				case 'genymotion':
					args.push('-T', 'emulator', '-C', testdevice.deviceName, '--deploy-type', 'development');
					break;
			}

			const prc = spawn(cmd, args, {
				shell: true
			});
			prc.stdout.on('data', data => {
				Output.debug(data, 'debug');
				const line = data.toString().trim();

				const
					regStr = 'Client connected|Please manually launch the application or press CTRL-C to quit',
					isLaunched = new RegExp(regStr, 'g').test(line);

				if (isLaunched) {
					Output.finish(resolve, null);
				}
			});
			prc.stderr.on('data', data => {
				Output.debug(data, 'debug');
			});
			prc.on('exit', () => {
				reject('Failed on application build');
			});
		});
	}

	/*****************************************************************************
	 * Packages the required application
	 ****************************************************************************/
	static packageApp(target) {
		return new Promise(async (resolve, reject) => {
			Output.info('Building Application... ');

			let error = false,
				storeBuild = true,
				appPath = this.genRootPath('App'),
				distPath = this.genRootPath('Package');

			let
				cmd = 'appc',
				args = [ 'run', '--platform', global.platformOS.toLowerCase(), '-d', appPath, '--deploy-type', 'production', '--target', `dist-${target}` ];

			if (global.platformOS === 'iOS') {
				if (target === 'appstore') {
					target = 'distribution';
					purgeSoasta();
				} else {
					storeBuild = false;
					args.push('--output-dir', distPath);
				}

				let
					uuid,
					distName;

				let profiles = await ioslib.provisioning.getProvisioningProfiles();

				for (const profile of profiles[target]) {
					if (!profile.expired) {
						if (storeBuild && profile.name === 'AppiumTest') {
							uuid = profile.uuid;
							distName = `"${profile.teamName} (${profile.teamId})"`;
							break;
						} else if (!storeBuild) {
							uuid = profile.uuid;
							distName = `"${profile.teamName} (${profile.teamId})"`;
						}
					} else {
						Output.warn(`The Profile "${profile.name}" has expired`);
					}
				}

				args.push(
					'--distribution-name',
					distName,
					'--ios-version',
					testDevices.simulator.platVersion,
					'--pp-uuid',
					uuid
				);
			}

			if (global.platformOS === 'Android') {
				keystore.location = path.join(global.projRoot, 'Config', 'Support', keystore.name);

				args.push(
					'--output-dir',
					distPath,
					'--api-level',
					app.apiLevel,
					'--alias',
					keystore.alias,
					'--keystore',
					keystore.location,
					'--store-password',
					keystore.password,
					'--key-password',
					keystore.password
				);
			}

			const prc = spawn(cmd, args, {
				shell: true
			});
			prc.stdout.on('data', data => {
				Output.debug(data, 'debug');
			});
			prc.stderr.on('data', data => {
				Output.debug(data, 'debug');
				// Appc CLI doesn't provide an error code on fail, so need to monitor the output and look for issues manually
				// If statement is there so that [WARN] flags are ignored on stderr
				// if(data.toString().includes('[ERROR]')) error = true;
			});
			prc.on('exit', code => {
				(code !== 0 || error === true) ? reject('Failed on application build') : Output.finish(resolve, null);
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

			const prc = spawn(cmd, args, {
				shell: true
			});
			prc.stdout.on('data', data => {
				Output.debug(data, 'debug');
			});
			prc.stderr.on('data', data => {
				Output.debug(data, 'debug');
				// Appc CLI doesn't provide an error code on fail, so need to monitor the output and look for issues manually
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
	 * build was successful.
	 ****************************************************************************/
	static checkBuiltApp(platform) {
		let log;

		if (global.platformOS === 'iOS') {
			log = 'iphone';
		}

		if (global.platformOS === 'Android') {
			log = 'android';
		}

		let
			rootPath = this.genRootPath('App'),
			appPath = this.genAppPath(platform),
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
	static checkPackagedApp() {
		let platform = global.platformOS.toLowerCase();

		const
			rootPath = this.genRootPath('Package'),
			packagedApp = (platform === 'ios') ? path.join(rootPath, `${app.name}.ipa`) : path.join(rootPath, `${app.name}.apk`);

		return fs.existsSync(packagedApp);
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
	static genAppPath(platform) {
		const rootPath = this.genRootPath('App');

		switch (platform) {
			case 'iosDevice':
				return path.join(rootPath, 'build', 'iphone', 'build', 'Products', 'Debug-iphoneos', `${app.name}.app`);

			case 'simulator':
				return path.join(rootPath, 'build', 'iphone', 'build', 'Products', 'Debug-iphonesimulator', `${app.name}.app`);

			case 'androidDevice':
			case 'emulator':
			case 'genymotion':
				return path.join(rootPath, 'build', 'android', 'bin', `${app.name}.apk`);

			default:
				if (global.platformOS === 'iOS') {
					return path.join(rootPath, 'build', 'iphone', 'build', 'Products', 'Debug-iphonesimulator', `${app.name}.app`);
				} else if (global.platformOS === 'Android') {
					return path.join(rootPath, 'build', 'android', 'bin', `${app.name}.apk`);
				}
		}
	}

	/*****************************************************************************
	 * Generate a path to the root of the application directory
	 ****************************************************************************/
	static genRootPath(type) {
		let file;

		if (type === 'App') {
			file = app.name;
		} else if (type === 'Module') {
			file = mod.name;
		} else if (type === 'Package') {
			file = app.name;
		}

		return path.join(global.projRoot, 'Build', `${global.hostOS}-${global.platformOS}`, type, file);
	}
}

/*******************************************************************************
 * Remove references to SOASTA for iOS from the tiapp.xml to avoid conflicts in
 * Apples App Store Connect.
 ******************************************************************************/
function purgeSoasta() {
	let
		appPath = Appc_Helper.genRootPath('App'),
		filePath = path.join(appPath, 'tiapp.xml'),
		tiapp = require('tiapp.xml').load(filePath);
	// Remove SOASTA module reference
	tiapp.removeModule('com.soasta.touchtest', 'iphone');
	// Remove SOASTA property refrence
	tiapp.removeProperty('com-soasta-touchtest-ios-appId');

	tiapp.write();
}

/*******************************************************************************
 * Retrieve the name of the certificate for the QE Department
 ******************************************************************************/
async function getCert() {
	let
		certificate,
		developerCerts = (await ioslib.certs.getCerts()).developer;

	developerCerts.forEach(cert => {
		if (cert.name.match(/QE Department \(\w{10}\)/)) {
			certificate = `"${cert.name}"`;
		}
	});

	return certificate;
}

/*******************************************************************************
 * Retrieve the UUID of the app development provisioning profile
 ******************************************************************************/
async function getUUID() {
	let
		uuid,
		provisioningProfiles = (await ioslib.provisioning.getProvisioningProfiles()).development;

	provisioningProfiles.forEach(profile => {
		if (profile.name === 'Any App Development') {
			uuid = profile.uuid;
		}
	});

	return uuid;
}

module.exports = Appc_Helper;
