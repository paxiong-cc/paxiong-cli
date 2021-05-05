'use strict';

const pkgDir = require('pkg-dir')
const formatPath = require('@paxiong-cli/format-path')
const path = require('path')
const npminstall = require('npminstall')
const getNpmInfo = require('@paxiong-cli/get-npm-info')
const pathExists = require('path-exists').sync
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
		 // package的缓存前缀
		 this.cacheFilePathPrefix = this.packageName.replace('/', '_')
	}

	async prepare() {
		if (this.packageVersion === 'latest') {
			this.packageVersion = await getNpmInfo.getNpmLatestVersion(this.packageName)
		}
	}

	// _ccc@0.5.1@ccc
	get cacheFilePath() {
		return path.resolve(this.storePath, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
	}

	// 判断当前Package是否存在
	async exists() {
		if (this.storePath) {
			await this.prepare()
			return pathExists(this.cacheFilePath)
		} else {
			return pathExists(this.targetPath)
		}
	}

	// 安装Package
	async install() {
		await this.prepare()
		return npminstall({
			root: this.targetPath,
			storeDir: this.storePath,
			register: getNpmInfo.getRegistry(),
			pkgs: [
				{ name: this.packageName, version: this.packageVersion }
			]
		})
	}

	// 更定Package
	update() {}

	// 获取入口文件的路径
	getRootFilePath() {
		// 获取pakage.json所在的目录
		const dir = pkgDir.sync(this.targetPath)
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

