'use strict';

const pkgDir = require('pkg-dir')
const formatPath = require('@paxiong-cli/format-path')
const path = require('path')
const fse = require('fs-extra')
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

	// 创建缓存目录，获取包最新版本号
	async prepare() {
		if (this.storePath && !pathExists(this.storePath)) {
			fse.mkdirpSync(this.storePath)
		}

		if (this.packageVersion === 'latest') {
			this.packageVersion = await getNpmInfo.getUpdateVersions('', this.packageName)
		}
	}

	// _ccc@0.5.1@ccc
	get cacheFilePath() {
		return path.resolve(this.storePath, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
	}

	getCacheFilePath() {
		return path.resolve(this.storePath, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
	}

	// 判断当前Package是否存在，具体到包和版本号
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

	// 更新Package
	async update() {
		if (pathExists(this.cacheFilePath)) {
			const version = await getNpmInfo.getUpdateVersions(null, this.packageName)
			this.packageVersion = version
			return npminstall({
				root: this.targetPath,
				storeDir: this.storePath,
				register: getNpmInfo.getRegistry(),
				pkgs: [
					{ name: this.packageName, version }
				]
			})
		}
	}

	// 获取入口文件的路径
	getRootFilePath() {
		function _getRootFile(targetPath) {
			// 获取pakage.json所在的目录
			const dir = pkgDir.sync(targetPath)
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

		if (this.storePath) {
		  return _getRootFile(this.cacheFilePath)
		} else {
			return _getRootFile(this.targetPath)
		}
	}
}

module.exports = Package;

