'use strict';

const Package = require('@paxiong-cli/package')
const log = require('@paxiong-cli/log')
const path = require('path')
const cp = require('child_process')

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
    try {
      // 删减cmd中的参数
      const args = Array.from(arguments)
      const cmd = args[args.length - 1]
      const o = Object.create(null)
      Object.keys(cmd).forEach(key => {
        if (
          cmd.hasOwnProperty(key)
          &&!key.startsWith('_')
          && key !== 'parent'
        ) {
          o[key] = cmd[key]
        }
      })
      args[args.length - 1] = o
      const code = `require("${rootFile}").call(null, ${JSON.stringify(args)})`
      // 创建node子进程
      const child = cp.spawn('node', ['-e', code], {
        cwd: process.cwd(),
        stdio: 'inherit'
      })
      child.on('error', e => {
        log.error(e.message)
        process.exit(1)
      })
      child.on('exit', e => {
        log.verbose('命令执行成功:' + e)
      })
      // require(rootFile).call(null, Array.from(arguments))
    } catch(err) {
      log.error(err.message)
    }
  }
}

module.exports = exec;
