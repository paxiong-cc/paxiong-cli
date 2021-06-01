'use strict';

const Package = require('@paxiong-cli/package')
const log = require('@paxiong-cli/log')
const path = require('path')
const cp = require('child_process')
const CACHE_DIR = 'template'

async function exec() {
  const options = {
    // targetPath: process.env.CLI_TARGET_PATH,
    targetPath: process.env.CLI_HOME_PATH,
    storePath: path.join(process.env.CLI_HOME_PATH, CACHE_DIR),
    packageName: '@paxiong-cli/init',
    packageVersion: 'latest',
  }

  let pkg

  // log.verbose('targetPath', options.targetPath)
  // log.verbose('storePath', options.storePath)

  // 没有输入-tp的时候
  if (!process.env.CLI_TARGET_PATH) {
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
    options.targetPath = process.env.CLI_TARGET_PATH
    pkg = new Package(options)
  }

  const reg = /^[a-zA-Z]+([-_][a-zA-Z]+\d*)*$/
  const projectName = arguments[arguments.length - 1].args[0]
  if (projectName && !reg.test(projectName)) {
    log.error('项目名称不合法')
    return
  }

  // 只是为了获取-tp初始文件目录
  const rootFile = pkg.getRootFilePath()
  process.env.PROJECT_NAME = arguments[arguments.length - 1].args[0]

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
      // const child = cp.spawn('node', ['-e', code], {
      //   cwd: process.cwd(),
      //   stdio: 'inherit'
      // })
      const child = spawn('node', ['-e', code], {
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

// 兼容windows
function spawn(command, args, options) {
  const win32 = process.platform === 'win32'

  const cmd = win32 ? 'cmd' : command
  // windows 'cmd', ['/c', 'node', '-e'], options /c静默执行
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args;

  return cp.spawn(cmd, cmdArgs, options || {})
}

module.exports = exec;
