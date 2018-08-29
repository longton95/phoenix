'use strict';

const
	os = require('os'),
	spawn = require('child_process').spawn,
	Output = require('./Output_Helper.js'),
	exec = require('child_process').execSync;

class Device_Helper {
	/*****************************************************************************
	 * Launch the emulator specified in the device_config.js for the current test
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
			prc.stdout.on('data', data => {
				if (data.toString().includes('Boot is finished')) {
					return Output.finish(resolve, prc.pid);
				}
			});

			prc.stderr.on('data', data => {
				Output.debug(data.toString(), 'debug');
			});
		});
	}

	/*****************************************************************************
	 * Use the PID of the emulator to kill it
	 *
	 * @param {String} pid - The process ID to terminate
	 ****************************************************************************/
	static killEmu() {
		return new Promise(resolve => {
			Output.info('Shutting Down the Android Emulator... ');

			if (global.androidPID) {
				// TODO: Add a Windows method for ending the emulator
				exec(`kill -9 ${global.androidPID}`);

				delete global.androidPID;
			}

			Output.finish(resolve, null);
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
	 * Use the appropriate command on the host operating system to terminate a
	 * given process
	 *
	 * @param {String} processName - The name of the process to kill
	 ****************************************************************************/
	static async processKill(processName) {
		switch (os.platform()) {
			case 'darwin':
				exec(`killall -9 ${processName}`);
				break;
			case 'win32':
				exec(`Taskkill /IM ${processName}.exe /F`);
				break;
		}
	}

	/*****************************************************************************
	 * Kill all the test simulators and emulators in the event of SIGINT.
	 ****************************************************************************/
	static quickKill() {
		console.log();
		spawn('xcrun', [ 'simctl', 'shutdown', 'booted' ]);
		spawn('killall', [ '-9', 'qemu-system-i386' ]);
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
