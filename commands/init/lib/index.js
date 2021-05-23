'use strict';

const Command = require('@paxiong-cli/command')
const log = require('@paxiong-cli/log')
const fs = require('fs')
const inquirer = require('inquirer')
const fse = require('fs-extra')
const semver = require('semver')
const getProjectTemplate = require('./getProjectTemplate');
const Package = require('@paxiong-cli/package')
const TPYE_PROJECT = 'project'
const TPYE_COMPONENT = 'component'

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || '' // 命令初始的名字
    this.force = !!this._argv[1].force
    this.projectInfo = null // 选择的项目信息
    this.template = null // 远程获取的template
    log.verbose('projectName', this.projectName)
    log.verbose('force', this.force)
  }

  async exec() {
    try {
      // 1.准备阶段
      await this.prepare();
      // 2.下载模板
      if (this.projectInfo) {
        await this.downloadTemplate()
      }
      // 3.安装模板 
    } catch(e) {
      log.error(e.message)
    }
  }

  async prepare() {
    // 判断线上模板是否存在
    const template = await getProjectTemplate()
    if (!(template && template.data.rows.length)) {
      throw Error('项目模板不存在')
    }
    this.template = template.data.rows

    // 1.项目目录不为空
    if (this.isDirEmpty()) {
      // 当前目录不为空时询问是否继续安装
      if (!(await this.isContinue())) {
        return
      }
    }
    // 2.选择创建项目或组件
    this.projectInfo = await this.getProjectInfo()
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

  // 选择创建项目或组件
  async getProjectInfo() {
    let info = {}
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
      const projectInfo = await inquirer.prompt([
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
        {
          type: 'list',
          name: 'projectTemplate',
          message: '请选择项目模板',
          choices: this.selectTemplate()
        }
      ])
      return info = { ...projectInfo, projectType: TPYE_PROJECT }
    // 创建组件
    } else if (type === TPYE_COMPONENT) {

    }
  }

  // 下载模板项目
  async downloadTemplate() {
    const { npm_name, version } = this.template.find(item => item.npm_name === this.projectInfo.projectTemplate)
    const targetPath = path.resolve(process.env.CLI_HOME_PATH, 'template')
    const storePath = path.resolve(process.env.CLI_HOME_PATH, 'template', 'node_modules')

    const templateNpm = new Package({
      targetPath,
      storePath,
      packageName: npm_name,
      packageVersion: version
    })

    if (!(await templateNpm.exists())) {
      await templateNpm.install()
    } else {
      await templateNpm.update()
    }
  }

  // 选择项目模板
  selectTemplate() {
    return this.template.map(item => {
      return {
        value: item.npm_name,
        name: item.name
      }
    })
  }
}

function init(argv) {
  new InitCommand(argv)
}

module.exports = init;
module.exports.InitCommand = InitCommand