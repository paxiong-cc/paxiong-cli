'use strict';

module.exports = core;

const path = require('path')
const log = require('@paxiong-cli/log')
const pkg = require('../package.json')
const semver = require('semver')
const colors = require('colors')
const userHome = require('user-home')
const pathExists = require('path-exists')
const dotenv = require('dotenv')
const config = require('./config');


function core() {
  try {
    rootCheck()
    checkNodeVersion()
    checkUserHome()
    checkArgs()
    checkVersion()
    checkEnv()
  } catch (err) {
    log.error(err)
  }
}

// 权限检查
function rootCheck() {
  const rootCheck = require('root-check')
  rootCheck()
}

// 检查cli版本号
function checkVersion() {
  log.notice('version', pkg.version)
}

// 检查node版本号
function checkNodeVersion() {
  const currentVersion = process.version
  if (semver.lt(currentVersion, config.LOWEST_NODE_VERSION)) {
    throw Error(colors.red(`paxiong-cli 需要安装 v${config.LOWEST_NODE_VERSION} 以上版本的 Node.js`))
  }
}

// 用户主目录检查
function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw Error(colors.red(`当前用户主目录不存在`))
  }
}

// 检查参数
function checkArgs() {
  const args = require('minimist')(process.argv.slice(0))
  args.debug
    ? log.level = ' verbose'
    : ''
}

// 检查环境变量
function checkEnv() {
  const dotenvPath = path.resolve(userHome, '.env')
  // 如果主目录下存在.env文件会解析并且添加到process.env中
  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: dotenvPath
    })
  }
  console.log(createGlobalEnv())
}

// 创建全局环境变量
function createGlobalEnv() {
  const cliConfig = {
    home: userHome
  }

  if (process.env.CLI_HOME) {
    cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
  } else {
    cliConfig['cliHome'] = path.join(userHome, config.DEFUALT_CLI_HOME)
  }

  return cliConfig
}
