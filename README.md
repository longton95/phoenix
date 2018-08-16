# Phoenix

## About This Project

An _exciting_ new project aimed at the automation of the Appcelerator smoke tests. This will use Appium in a similar fashion to the automated Regression test suite; [Yeti](https://github.com/appcelerator/yeti). Check back soon for more!

FYI, there's probably a fair few bugs, as the code is largely replicated from Yeti, and just tweaked to work with Desktop applications, submit [issues](https://github.com/appcelerator/phoenix/issues) to help me squash bugs faster :D

## Roadmap

- [ ] Get Studio interactions for MacOS working
- [ ] Create method of simultaneously testing a desktop app and a mobile app
- [ ] Re-integrate Zephyr API usage to push results to JIRA
- [ ] Add Windows support

## Discussion Points

* Do we assume a default location for the Studio workspace?
* Do we assume that the user is already logged in?

## Running on MacOS

### Setup Steps

#### Install Appium for Mac

* Download an Appium for Mac release from [here](https://github.com/appium/appium-for-mac/releases) I'm currently using beta 3
* Unzip the download, and place it in your `/Applications` directory

#### Install Appcelerator Studio

* Can be downloaded from the [Axway Dashboard](https://platform.axway.com)

#### Install npm Packages

* From the project root, run `npm i`

### Running

* App creation in Studio requires some platform credentials, export these as so from the CLI:
```
export APPCUSER=<Dashboard Username>
export APPCPASS=<Dashboard Password>
```

* Run the suite with `npm run test -- -p Mac`

You may also be prompted to allow certain programs accessibility access in System Preferences, this will only be required once.

## Running on Windows

🚧 Coming soon 🚧