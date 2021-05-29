'use strict';

const Spinner = require('cli-spinner').Spinner

const spinnerStart = function(msg) {
	const spinner = new Spinner(msg + 'loading.. %s')
	spinner.setSpinnerString('|/-\\')
	spinner.start()
	return spinner
}

const sleep = async function(val=1000) {
	return new Promise(resolve => setTimeout(resolve, val))
}

exports.spinnerStart = spinnerStart
exports.sleep = sleep