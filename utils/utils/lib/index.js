'use strict';

const Spinner = require('cli-spinner').Spinner
const fs = require('fs')

const spinnerStart = function(msg) {
	const spinner = new Spinner(msg + 'loading.. %s')
	spinner.setSpinnerString('|/-\\')
	spinner.start()
	return spinner
}

const sleep = async function(val=1000) {
	return new Promise(resolve => setTimeout(resolve, val))
}

// 读取文件
const readFile = function(path, options = {}) {
	if (fs.existsSync(path)) {
		const buffer = fs.readFileSync(path)
		if (buffer) {
			if (options.toJson) {
				return buffer.toJSON()
			} else {
				return buffer.toString()
			}
		}
	}
	return null
}

// 写入文件
const writeFile = function(path, data, { rewrite = true } = {}) {
	if (fs.existsSync(path)) {
		if (rewrite) {
			fs.writeFileSync(path, data)
			return true
		}
		return false

	} else {
		fs.writeFileSync(path, data)
		return true
	}
	
}

exports.spinnerStart = spinnerStart
exports.sleep = sleep
exports.readFile = readFile
exports.writeFile = writeFile