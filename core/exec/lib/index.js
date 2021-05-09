'use strict';

const Package = require('@paxiong-cli/package')
const log = require('@paxiong-cli/log')
const path = require('path')

async function exec() {
  const options = {
    targetPath: process.env.CLI_TARGET_PATH,
    storePath: process.env.CLI_HOME_PATH,
    packageName: arguments[arguments.length - 1].args[0] || 'paxiong',
    packageVersion: 'latest',
  }
  console.log(process.env.CLI_HOME_PATH)
  const CACHE_DIR = 'dependencies'
  let pkg

  log.verbose('targetPath', options.targetPath)
  log.verbose('storePath', options.storePath)

  // 没有输入-tp的时候
  if (!options.targetPath) {
    options.targetPath = path.resolve(process.env.CLI_HOME_PATH, CACHE_DIR)
    options.storePath = path.resolve(options.targetPath, 'node_modules')

    pkg = new Package(options)

    // 存在更新
    if (await pkg.exists()) {
      await pkg.update()

    // 不存在则安装
    } else {
      await pkg.install()
    }

  } else {
    Reflect.deleteProperty(options, 'storePath')
    pkg = new Package(options)
  }

  const rootFile = pkg.getRootFilePath()
  
  // init模块路径
  if (rootFile) {
    require(rootFile).apply(null, arguments)
  }
}

module.exports = exec;
