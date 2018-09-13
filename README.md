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

## Running on MacOS

### Setup Steps

### Install the Appcelerator CLI
Run `npm i appcelerator -g`

#### Install npm Packages
From the project root, run `npm i`

### Running
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

* Run the suite with `npm run test`

## Running on Windows

### Setup Steps

#### Install the Windows SDK
Download and install the [Windows SDK](https://developer.microsoft.com/en-us/windows/downloads/windows-10-sdk) from Microsoft.

#### Install the Windows Application Driver
Download and install the [Windows Application Driver](https://github.com/Microsoft/WinAppDriver/releases/tag/v1.0). Currently the Appium Windows driver only supports version 1.0, which is the latest full release.

#### Install Appcelerator Studio
Can be downloaded from the [Axway Dashboard](https://platform.axway.com/#/product/studio)

#### Install npm Packages
From the project root, run `npm i`

### Running
* App creation in Studio requires some platform credentials, export these as so from the CLI:
```
setx APPCUSER "<Dashboard Username>"
setx APPCPASS "<Dashboard Password>"
```

* Run the suite with `npm run test -- -p <platform>`
