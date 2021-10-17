'use strict';

module.exports = core;
const log = require('@paxiong-cli/log')
const path = require('path')
const pkg = require('../package.json')
const colors = require('colors')
const userHome = require('user-home')
const pathExists = require('path-exists')
const dotenv = require('dotenv')
const config = require('./config');
const exec = require('@paxiong-cli/exec')

const commander = require('commander')
const program = new commander.Command()

async function core() {
  try {
    prepare()
    registerCommand()
  } catch (err) {
    log.error(err)
    if (process.env.LOG_LEVEL === 'verbose') {
      console.log(err)
    }
  }
}

// 准备阶段
async function prepare() {
  checkVersion()
  rootCheck()
  checkUserHome()
  checkEnv()
  await checkUpdate()
}

// 检查cli版本号
function checkVersion() {
  log.notice('version', pkg.version)
}

// 权限检查
function rootCheck() {
  const rootChecks = require('root-check')
  rootChecks()
}

// 用户主目录检查
function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw Error(colors.red(`当前用户主目录不存在`))
  }
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
  createGlobalEnv()
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

  process.env.CLI_HOME_PATH = cliConfig.cliHome
}

// 检查是否有新版本
async function checkUpdate() {
  // 获取当前版本号
  const currentVersion = pkg.version
  const currentPackageName = pkg.name
  // 获取线上版本号列表
  const { getUpdateVersions } = require('@paxiong-cli/get-npm-info')
  const versionList = await getUpdateVersions(currentVersion, currentPackageName)
  // 提示更新到最新版本
  if (versionList.length) {
    log.warn(colors.yellow('版本更新', `你当前的 paxiong-cli 版本是 ${currentVersion}, 请更新至最新版本 ${versionList[0]}`))
  }
}

// 注册命令
function registerCommand() {
  // 初始配置
  program
    .name(Object.keys(pkg.bin)[0])
    // .usage('<command> [options]')
    .usage('<command> options')
    .version(pkg.version)
    .option('-d, --debug', 'open debug', false)
    .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '')

  // 注册命令
  program
    .command('init [projectName]')
    .option('-f, --force', '是否强制初始化项目')
    // .action(init)
    .action(exec)

  // 注册命令
  program
    .command('publish')
    .option('-rs, --resetGitServer', '是否重置git平台', true)
    .action(exec)

  // 监听debug命令
  program.on('option:debug', function() {
    if (program._optionValues.debug) {
      process.env.LOG_LEVEL = 'verbose'
    } else {
      process.env.LOG_LEVEL = 'info'
    }
    log.level = process.env.LOG_LEVEL
  })

  program.on('option:targetPath', function() {
    process.env.CLI_TARGET_PATH = program._optionValues.targetPath
  })

  // 监听不存在的命令
  program.on('command:*', function(obj) {
    const cmdList = program.commands
    console.log(colors.red('未知命令: ' + obj[0]))

    if (cmdList.length) {
      const availableList = cmdList.map(item => item.name())
      console.log(colors.green('可用命令: ' + availableList.join(' ')))
    }
  })

  // 没有输入命令时自动展示帮助文档
  // if (program.args && program.args.length < 1) {
  if (process.argv.length < 3) {
    program.outputHelp()
  }

  program.parse(process.argv)
}