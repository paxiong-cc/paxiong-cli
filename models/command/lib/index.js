'use strict';

const semver = require('semver')
const colors = require('colors')
const log = require('@paxiong-cli/log')
const LOWEST_NODE_VERSION = '10.0.0'

class Command {
  constructor(argv) {
		if (!argv) {
			throw Error('参数不能为空!')
		}
		if (!Array.isArray(argv)) {
			throw Error('参数必须为数组!')
		}
		if (argv.length < 1) {
			throw Error('参数列表为空')
		}

		this._argv = argv
		let runner = new Promise((resolve, reject) => {
			let chain = Promise.resolve()
			chain = chain.then(() => this.checkNodeVersion())
			chain = chain.then(() => this.initArgs())
			chain = chain.then(() => this.init())
			chain = chain.then(() => this.exec())
			chain.catch(err => {
				console.log(err.message)
				log.error(err.message)
			})
		})
	}

	init() {
		throw Error('init必须实现')
	}

	initArgs() {
		this._cmd = this._argv[this._argv.length - 1]
		this._argv = this._argv.slice(0, this._argv.length - 1)[0]
	}

	exec() {
		throw Error('exec必须实现')
	}

	// 检查node版本号
	checkNodeVersion() {
		const currentVersion = process.version
		if (semver.lt(currentVersion, LOWEST_NODE_VERSION)) {
			throw Error(colors.red(`paxiong-cli 需要安装 v${LOWEST_NODE_VERSION} 以上版本的 Node.js`))
		}
	}
}

module.exports = Command;
