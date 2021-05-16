'use strict';

const Command = require('@paxiong-cli/command')
const log = require('@paxiong-cli/log')
const fs = require('fs')
const inquirer = require('inquirer')
const fse = require('fs-extra')
const semver = require('semver')

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || ''
    this.force = !!this._argv[1].force
    log.verbose('projectName', this.projectName)
    log.verbose('force', this.force)
  }

  exec() {
    // 1.准备阶段
    this.prepare();
    // 2.下载模板
    // 3.安装模板 
  }

  async prepare() {
    // 1.项目目录不为空
    if (this.isDirEmpty()) {
      // 当前目录不为空时询问是否继续安装
      if (!(await this.isContinue())) {
        return
      }
    }
    // 2.选择创建项目或组件
    this.getProjectInfo()
  }

  // 目录是否为空
  isDirEmpty() {
    // 获取工作目录(哪里调用就在哪)
    const localPath = process.cwd()
    let fileList = fs.readdirSync(localPath)
    fileList = fileList.filter(file => {
      return !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
    })
    return fileList && fileList.length > 0
  }

  // 是否继续安装
  async isContinue() {
    let isContinue = false
    // 判断是否有--force参数
    if (!this.force) {
      isContinue = (await inquirer
        .prompt([{
          type: 'confirm',
          name: 'isContinue', // 输入完返回的信息提示
          message: '当前文件夹不为空, 是否继续创建项目?', // 在输入时最前边提示
          default: false,
        }]))['isContinue']
    }
    // 二次确认
    if (isContinue) {
      isContinue = (await inquirer
        .prompt([{
          type: 'confirm',
          name: 'isContinue', // 输入完返回的信息提示
          message: '是否确认清空当前目录下的文件?', // 在输入时最前边提示
          default: false,
        }]))['isContinue']
    }
    // 清空当前文件夹下的内容
    if (isContinue || this.force) {
      fse.emptyDirSync(process.cwd())
    }

    return isContinue || this.force
  }

  // 创建项目或组件
  async getProjectInfo() {
    let projectInfo = {}
    const TPYE_PROJECT = 'project'
    const TPYE_COMPONENT = 'component'
    // 选择项目或组件
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: '请选择初始化类型',
      default: TPYE_PROJECT,
      choices: [
        {
          name: '项目',
          value: TPYE_PROJECT
        },
        {
          name: '组件',
          value: TPYE_COMPONENT
        }
      ]
    })

    // 输入项目信息
    if (type === TPYE_PROJECT) {
      projectInfo = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: '请输入项目名称',
          default: 'paxiong',
          validate: function(v) {
            const done = this.async()
            // 合法 a, a-b, a_b, a_b_c, a_b1_c1
            const reg = /^[a-zA-Z]+([-_][a-zA-Z]+\d*)*$/
            if (!reg.test(v)) {
              done('请输入合法的项目名称')
              return
            }
            done(null, true)
          }
        },
        {
          type: 'input',
          name: 'projectVersion',
          message: '请输入项目版本号',
          default: '1.0.0',
          validate: function(v) {
            const done = this.async()
            if (!semver.valid(v)) {
              done('请输入合法的版本号')
              return
            }
            done('', true)
          },
          filter: function(v) {
            return semver.valid(v)
          }
        },
      ])

    // 创建组件
    } else if (type === TPYE_COMPONENT) {

    }
  }
}

function init(argv) {
  new InitCommand(argv)
}

module.exports = init;
module.exports.InitCommand = InitCommand