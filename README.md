# Phoenix

An _exciting_ new project aimed at the automation of the Appcelerator smoke tests. This will use Appium in a similar fashion to the automated Regression test suite; [Yeti](https://github.com/appcelerator/yeti). Check back soon for more!

FYI, there's probably a fair few bugs, as the code is largely replicated from Yeti, and just tweaked to work with Desktop applications, submit issues to help me squash bugs faster :D

Zephyr stuff won't work yet either, need to make it point to the correct location for smokes, so preferably don't try and push to JIRA for now

...Also, just don't attempt to run this for Windows (yet), I have **no** idea what will happen, might just error out, might wreck your system...

## Setup to Run on MacOS

* Download an Appium for Mac release from [here](https://github.com/appium/appium-for-mac/releases) I'm currently using beta 3
* Unzip the download, and place it in your `/Applications` directory

## Running On MacOS
* `npm i`
* `npm run test -- -p Mac`

You may also be prompted to allow certain programs accessibility access in System Preferences, this will only be required once.

## Discussion Points
* Do we assume a default location for the Studio workspace?