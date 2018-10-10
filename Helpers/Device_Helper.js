'use strict';

const
	path = require('path'),
	childProcess = require('child_process'),
	Output = require('./Output_Helper.js');

class Device_Helper {
	/*****************************************************************************
	 * Launch the emulator specified in the Test_Config.js for the current test
	 *
	 * @param {String} devName - The name of the AVD emulator used for testing
	 ****************************************************************************/
	static launchEmu(devName) {
		return new Promise(resolve => {
			Output.info(`Launching Android device '${devName}'... `);

			if (global.androidPID) {
				Output.skip(resolve, null);
			} else {
				const
					cmd = path.join(process.env.ANDROID_HOME, 'emulator', 'emulator'),
					args = [ '-avd', devName, '-wipe-data' ];

				const prc = childProcess.spawn(cmd, args);

				global.androidPID = prc.pid;

				checkBooted(devName).then(() => {
					return Output.finish(resolve, null);
				});
			}
		});
	}

	/*****************************************************************************
	 * Kill any active Android devices
	 ****************************************************************************/
	static async killEmu() {
		if (global.androidPID) {
			if (global.hostOS === 'Mac') {
				await childProcess.execSync(`kill -9 ${global.androidPID}`, {
					stdio: [ 0 ]
				});
			}
			delete global.androidPID;
		}

		if (global.genymotionPID) {
			await childProcess.execSync(`kill -9 ${global.genymotionPID}`, {
				stdio: [ 0 ]
			});
			delete global.genymotionPID;
		}

		this.quickKill();
	}

	/*****************************************************************************
	 * Launch a Genymotion device to run tests on. The name is retrieved from the
	 * Test_Config.js file
	 *
	 * @param {String} devName - The name of the Genymotion emulator used for
	 *													 testing
	 ****************************************************************************/
	static launchGeny(devName) {
		return new Promise(resolve => {
			Output.info(`Booting Genymotion Emulator '${devName}'`);

			if (global.genymotionPID || checkBooted()) {
				Output.skip(resolve, null);
			} else {
				const
					cmd = (global.hostOS === 'Mac') ? path.join('/', 'Applications', 'Genymotion.app', 'Contents', 'MacOS', 'player.app', 'Contents', 'MacOS', 'player') : path.join(), // TODO: Find Windows path to player
					args = [ '--vm-name', devName ];

				const prc = childProcess.spawn(cmd, args, { shell: true });

				global.genymotionPID = prc.pid;

				resolve();
			}
		});
	}

	/*****************************************************************************
	 * Kill all the iOS simulators using the killall command
	 ****************************************************************************/
	static killSim() {
		return new Promise(resolve => {
			Output.info('Shutting Down the iOS Simulator... ');

			childProcess.execSync('xcrun simctl shutdown booted');

			// Whilst the above does kill the simulator, it can leave processes running, so just nuke it after a period for safe shutdown
			setTimeout(() => {
				childProcess.spawn('killall', [ 'Simulator' ], { shell: true });
				Output.finish(resolve, null);
			}, 5000);
		});
	}

	/*****************************************************************************
	 * Kill all the test simulators and emulators in the event of SIGINT.
	 ****************************************************************************/
	static quickKill() {
		console.log();
		if (global.hostOS === 'Mac') {
			childProcess.spawn('xcrun', [ 'simctl', 'shutdown', 'booted' ]);
			childProcess.spawn('pkill', [ '-9', 'qemu-system-i386' ]);
			childProcess.spawn('pkill', [ '-9', 'player' ]);
		}
		if (global.hostOS === 'Windows') {
			childProcess.spawn('tskill', [ 'qemu-system-i386' ]);
			childProcess.spawn('tskill', [ 'player' ]);
		}
	}
}

/*******************************************************************************
 * Validate to see if there is a process running for this emulator.
 ******************************************************************************/
function checkBooted(devName) {
	return new Promise((resolve) => {
		let cmd = (devName === 'android-23-x86') ? 'adb -e shell getprop init.svc.bootanim' : 'adb -d shell getprop init.svc.bootanim';
		const interval = setInterval(() => {
			childProcess.exec(cmd, function (error, stdout, stderr) {

				if (stdout.toString().indexOf('stopped') > -1) {
					clearInterval(interval);
					resolve(true);
				}
				if (stderr) {
					Output.error(stderr);
				}
				if (error) {
					Output.error(error);
				} else {
					Output.info('Emulator still Booting');
				}
			});
		}, 1000);
	});
}

module.exports = Device_Helper;
