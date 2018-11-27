/// <reference types="Cypress" />

const
	appName = Cypress.env('APPNAME'),
	appleUser = Cypress.env('APPLEUSER'),
	applePass = Cypress.env('APPLEPASS'),
	appVersion = Cypress.env('APPVERSION');

Cypress.Screenshot.defaults({
	screenshotOnRunFailure: false
});

context('Publish Application Build', () => {
	before(() => {
		cy
			.wait(180000)
			.visit('https://developer.apple.com/account');
	});

	it(`Check That App Build ${appVersion} Has Been Validated By Apple`, () => {
		cy
			.get('#accountname')
			.type(appleUser)
			.get('#accountpassword')
			.type(applePass)
			.get('#submitButton2')
			.click();

		cy
			.contains('App Store Connect')
			.click();

		cy
			.contains('Go to App Store Connect')
			.click();

		cy
			.get('.main-nav-label')
			.each($el => {
				if ($el[0].innerText === 'My Apps') {
					cy
						.wrap($el)
						.click();
				}
			});

		cy
			.get('div')
			.contains(appName)
			.click();

		cy
			.contains('Activity')
			.click();

		cy
			.wait(5000)
			.get('.ibvm')
			.then($el => {
				if ($el[0].innerText !== appVersion) {
					cy
						.contains(`Version ${appVersion.split('.').slice(0, 3).join('.')}`)
						.click();
				}
			});

		cy
			.wait(2000)
			.get('.ibvm')
			.contains(appVersion)
			.click({
				force: true
			});

		cy
			.wait(5000)
			.get('div.pane-layout-content-main > div > div:nth-child(1) div > div:nth-child(2) > p')
			.then(result => {
				expect(result[0].innerText).equals('Validated');
			});
	});
});
