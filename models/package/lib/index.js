'use strict';

const pkgDir = require('pkg-dir').sync
const formatPath = require('@paxiong-cli/format-path')
const path = require('path')

class Package {
	constructor(options) {
		if (!options && Object.prototype.toString.call(options) !== "[object Object]") {
			throw Error('Package类的参数必须为对象')
		}

		 // package的路径
		 this.targetPath = options.targetPath
		 // package的存储路径
		 this.storePath = options.storePath
		 // package的name
		 this.packageName = options.packageName
		 // package的version
		 this.packageVersion = options.packageVersion
	}

	// 判断当前Package是否存在
	exists() {}

	// 安装Package
	install() {}

	// 更定Package
	update() {}

	// 获取入口文件的路径
	getRootFilePath() {
		// 获取pakage.json所在的目录
		const dir = pkgDir(this.targetPath)

		if (dir) {
			// 读取package.json
			const pkgFile = require(path.resolve(dir, 'package.json'))
			// 寻找main
			if (pkgFile && pkgFile.main) {
				// 路径的兼容(macOS/windows)
				return formatPath(path.resolve(dir, pkgFile.main))
			}
		}
	}
}

module.exports = Package;

