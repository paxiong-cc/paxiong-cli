'use strict';

const urlJoin = require('url-join')
const semver = require('semver')
const axios = require('axios')

// 获取可更新的版本号
async function getUpdateVersions(version, packageName) {
	// const url = 'http://registry.npm.taobao.org/@paxiong-cli/core'
	let flag = true
	if (!version) {
		version = '0.0.1'
		flag = false
	}
	const url = urlJoin(getRegistry(), packageName)
	const versions = await httpGetInfoVersions(url)
	let versionList = Object.keys(versions)
	versionList = versionList.filter(item => semver.satisfies(item, `>=${version}`))
	if (!flag) {
		versionList = versionList.slice(0, 1)
	} else {
		versionList = versionList.sort((a, b) => semver.gt(a, b) ? -1 : 1)
	}
	return versionList
}

// 发送请求获取版本号
async function httpGetInfoVersions(url) {
	return new Promise((resolve, reject) => {
		axios.get(url)
			.then(res => {
				if (res.status === 200) {
					resolve(res.data.versions)
				} else {
					resolve({})
				}
			})
			.catch(err => {
				resolve({})
			})
	})
}

// 获取仓库地址
function getRegistry(taobao = true) {
	return taobao ? 'https://registry.npm.taobao.org' : 'https://registry.npmjs.org'
}

module.exports = {
	getUpdateVersions,
	getRegistry
};