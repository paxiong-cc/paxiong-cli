'use strict';

const Spinner = require('cli-spinner').Spinner

const spinnerStart = function(msg) {
	const spinner = new Spinner(msg + 'loading.. %s')
	spinner.setSpinnerString('|/-\\')
	spinner.start()
	return spinner
}

exports.spinnerStart = spinnerStart