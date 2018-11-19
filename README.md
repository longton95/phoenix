# Phoenix

## About This Project
An _exciting_ new project aimed at the automation of the Appcelerator smoke tests. This will use Appium in a similar fashion to the automated Regression test suite; [Yeti](https://github.com/appcelerator/yeti). Check back soon for more!

FYI, there's probably a fair few bugs, as the code is largely replicated from Yeti, and just tweaked to work with Desktop applications, submit [issues](https://github.com/appcelerator/phoenix/issues) to help me squash bugs faster :D

An Epic for the project can be found on the [Axway JIRA](https://techweb.axway.com/jira/browse/QE-4017).

## Roadmap
- [x] Add MacOS Support
- [x] Create example test for the MacOS platform
- [x] Create method of simultaneously testing MacOS and iOS
- [x] Create method of simultaneously testing MacOS and Android
- [x] Add Windows Support
- [x] Create example test for the Windows platform
- [ ] Create method of simultaneously testing Windows and Windows Mobile
- [ ] Create method of simultaneously testing Windows and Android
- [x] Re-integrate Zephyr API usage to push results to JIRA

## Setup on MacOS

### Install HomeBrew
`/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"`

### Install Java
The installer can be downloaded from [here](https://www.oracle.com/technetwork/java/javase/downloads/index.html).

### Install Android Studio
The installer can be downloaded from [here](https://developer.android.com/studio/).

Alternatively you can also use `brew cask install android-studio` if you have HomeBrew installed.

### Configure an Android Emulator Within Android Studio
The device name that Appium will use can be found in `Config/Test_Config.js`. A matching device needs to be created on the local machine. This is usually done within Android Studio for ease of use.

### Download the Necessary Android NDK and SDKs Within Appcelerator Studio
From the studio download manager, download the latest NDK and SDKs. The NDK is required for module builds, and the SDKs for application builds.

### Install VirtualBox
The installer can be downloaded from [here](https://www.virtualbox.org).

Alternatively you can also use `brew cask install virtualbox` if you have HomeBrew installed.

### Install Genymotion
The installer can be downloaded from [here](https://www.genymotion.com/desktop/).

Alternatively you can also use `brew cask install genymotion` if you have HomeBrew installed.

### Configure a Genymotion Emulator Within Genymotion
From the Genymotion app, install a device matching the one labelled in `Config/Test_Config.js` matching the Genymotion name.

### Install NodeJS
The installer can be downloaded from [here](https://nodejs.org/en/).

Alternatively you can also use `brew install node` if you have HomeBrew installed.

### Install the Appcelerator CLI
Run `npm i appcelerator -g`

### Install Appcelerator Studio
This step is required to enable liveview tests, and will be needed until liveview is available in the SDK.

* Download the Appcelerator Studio installer from [here](https://platform.axway.com/#/product/studio).

* Once installed, open Studio and create a new mobile app project.

* Build the app with liveview enabled. If this has been done once, liveview will be configured.

### Install iOS Device Dependencies
* Install ios-deploy `npm i -g ios-deploy`.

* Install carthage `brew install carthage`.

* Install libimobiledevice `brew install libimobiledevice`.

### Install npm Packages
From the project root, run `npm i`.

## Setup on Windows

### Install the Windows SDK
Download and install the [Windows SDK](https://developer.microsoft.com/en-us/windows/downloads/windows-10-sdk) from Microsoft.

### Install the Windows Application Driver
Download and install the [Windows Application Driver](https://github.com/Microsoft/WinAppDriver/releases/tag/v1.0). Currently the Appium Windows driver only supports version 1.0, which is the latest full release.

### Install Java
The installer can be downloaded from [here](https://www.oracle.com/technetwork/java/javase/downloads/index.html).

### Install Android Studio
The installer can be downloaded from [here](https://developer.android.com/studio/).

### Configure an Android Emulator Within Android Studio
The device name that Appium will use can be found in `Config/Test_Config.js`. A matching device needs to be created on the local machine. This is usually done within Android Studio for ease of use.

### Download the Necessary Android NDK and SDKs Within Appcelerator Studio
From the studio download manager, download the latest NDK and SDKs. The NDK is required for module builds, and the SDKs for application builds.

### Install VirtualBox
The installer can be downloaded from [here](https://www.virtualbox.org).

### Install Genymotion
The installer can be downloaded from [here](https://www.genymotion.com/desktop/).

### Configure a Genymotion Emulator Within Genymotion
From the Genymotion app, install a device matching the one labelled in `Config/Test_Config.js` matching the Genymotion name.

### Install NodeJS
The installer can be downloaded from [here](https://nodejs.org/en/).

### Install the Appcelerator CLI
Run `npm i appcelerator -g`

### Install Appcelerator Studio
This step is required to enable liveview tests, and will be needed until liveview is available in the SDK.

* Download the Appcelerator Studio installer from [here](https://platform.axway.com/#/product/studio).

* Once installed, open Studio and create a new mobile app project.

* Build the app with liveview enabled. If this has been done once, liveview will be configured.

### Install npm Packages
From the project root, run `npm i`.

## Required Environment Variables
These are values that the suite needs in order to use all of its functionality. The command "export" is used on MacOS, if configuring these values on Windows then replace "export" with "set".

* iOS packaging requires an Apple developer user credentials in order to login to the Apple developer website,
```
export APPLEUSER=<Apple Username>
export APPLEPASS=<Apple Password>
```

* App creation requires some platform credentials, export these as so from the CLI:
```
export APPCUSER=<Dashboard Username>
export APPCPASS=<Dashboard Password>
```

* Publishing the results to JIRA requires credentials, export these as so from the CLI:
```
export JIRAUSER=<JIRA Username>
export JIRAPASS=<JIRA Password>
```

* Point to the Android SDK location, this is a requirement of Appium:
```
export ANDROID_HOME=<Path/To/Android/SDK>
```

* Point to the Java JDK location, this is a requirement of Appium:
```
export JAVA_HOME=<Path/To/Java/JDK>
```

* Configure the iPhone UDID, we're currently keeping this out of the test config file:
```
export IPHONEUDID=<iPhone UDID>
```

* Configure the Android device ID, we're currently keeping this out of the test config file:
```
export ANDROIDID=<Android Device ID>
```

## Running
`npm run test` - Run the suite.
`npm run clean` - Delete Build artifacts.

## Argument Flags
```
Usage: Test [options]

Options:

  -h, --help                             output usage information
  -p, --platforms <platform1,platform2>  List the platforms that you want to run the suite for. Defaults to 'iOS' and 'Android'.
  -l, --logging <level>                  Set the amount of Output returned by the process, options are 'debug' and 'basic'. Defaults to 'basic'.
  -A, --address <ip>                     The IP address for where the Appium server is. Defaults to localhost
  -r, --release <release_type>           The release type to use, GA or RC. Defaults to to GA
  -P, --port <port>                      The port that the Appium server will run on. Defaults to 4723
  -c, --cli <cli_version>                CLI version to test against. Defaults to latest
  -s, --sdk <sdk_version>                SDK version to test against. Defaults to latest
  -u, --update                           Publish the results to the Zephyr tests on JIRA.
  -f, --force                            Force rebuild applications.
```
