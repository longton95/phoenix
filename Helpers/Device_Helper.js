'use strict';

const
	os = require('os'),
	path = require('path'),
	spawn = require('child_process').spawn,
	Output = require('./Output_Helper.js'),
	exec = require('child_process').execSync;

class Device_Helper {
	/*****************************************************************************
	 * Launch the emulator specified in the Test_Config.js for the current test
	 *
	 * @param {String} devName - The name of the AVD emulator used for testing
	 ****************************************************************************/
	static launchEmu(devName) {
		return new Promise(resolve => {

			Output.info(`Launching Android device '${devName}'... `);

			const
				specs = calcResources(),
				cmd = `${process.env.ANDROID_HOME}/tools/emulator`,
				args = [ '-avd', devName, '-skin', '1080x1920', '-logcat', '*:v', '-no-snapshot-save', '-no-snapshot-load', '-no-boot-anim', '-memory', specs.mem, '-cores', specs.cpu, '-accel', 'auto', '-wipe-data', '-partition-size', '4096' ];

			const prc = spawn(cmd, args);

			global.androidPID = prc.pid;

			prc.stdout.on('data', data => {
				if (data.toString().includes('Boot is finished')) {
					return Output.finish(resolve, null);
				}
			});

			prc.stderr.on('data', data => {
				Output.debug(data.toString(), 'debug');
			});
		});
	}

	/*****************************************************************************
	 * Kill any active Android devices
	 *
	 * FIXME: Add Windows support to this function
	 ****************************************************************************/
	static async killEmu() {
		if (global.androidPID) {
			await exec(`kill -9 ${global.androidPID}`, {
				stdio: [ 0 ]
			});
			delete global.androidPID;
		}

		if (global.genymotionPID) {
			await exec(`kill -9 ${global.genymotionPID}`, {
				stdio: [ 0 ]
			});
			delete global.genymotionPID;
		}
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

			const
				cmd = (global.hostOS === 'Mac') ? path.join('/', 'Applications', 'Genymotion.app', 'Contents', 'MacOS', 'player.app', 'Contents', 'MacOS', 'player') : path.join(), // TODO: Find Windows path to player
				args = [ '--vm-name', devName ];

			const prc = spawn(cmd, args);

			global.genymotionPID = prc.pid;

			resolve();
		});
	}

	/*****************************************************************************
	 * Kill all the iOS simulators using the killall command
	 ****************************************************************************/
	static killSim() {
		return new Promise(resolve => {
			Output.info('Shutting Down the iOS Simulator... ');

			exec('xcrun simctl shutdown booted');

			// Whilst the above does kill the simulator, it can leave processes running, so just nuke it after a period for safe shutdown
			setTimeout(() => {
				spawn('killall', [ 'Simulator' ]);
				Output.finish(resolve, null);
			}, 5000);
		});
	}

	/*****************************************************************************
	 * Kill all the test simulators and emulators in the event of SIGINT.
	 *
	 * FIXME: Add Windows support to this function
	 ****************************************************************************/
	static quickKill() {
		console.log();
		if (global.hostOS === 'Mac') {
			spawn('xcrun', [ 'simctl', 'shutdown', 'booted' ]);
		}

		this.killEmu();
	}
}

/*******************************************************************************
 * Pick the Android specs based on host machine performance
 ******************************************************************************/
function calcResources() {
	let specs = {
		cpu: 2,
		mem: 2048
	};

	// If the resources are available, use them
	if ((os.cpus().length) >= 8) {
		specs.cpu = 4;
	}
	if ((((os.totalmem() / 1024) / 1024) / 1024) >= 8) {
		specs.mem = 4096;
	}

	return specs;
}

module.exports = Device_Helper;
