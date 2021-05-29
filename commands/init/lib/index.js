'use strict';

const Command = require('@paxiong-cli/command')
const log = require('@paxiong-cli/log')
const fs = require('fs')
const glob = require('glob')
const ejs = require('ejs')
const inquirer = require('inquirer')
const fse = require('fs-extra')
const semver = require('semver')
const getProjectTemplate = require('./getProjectTemplate');
const Package = require('@paxiong-cli/package')
const { spinnerStart, sleep } = require('@paxiong-cli/utils')
const kc = require('kebab-case')
const TPYE_PROJECT = 'project'
const TPYE_COMPONENT = 'component'
const TEMPLATE_TYPE_NORMAL = 'default'
const TEMPLATE_TYPE_CUSTOM = 'custom'

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || '' // 命令初始的名字
    this.force = !!this._argv[1].force
    this.projectInfo = null // 选择的项目信息
    this.template = null // 远程获取的template
    this.templateNpm = null // 下载的模板
    log.verbose('projectName', this.projectName)
    log.verbose('force', this.force)
  }

  async exec() {
    try {
      // 1.准备阶段
      if (! await this.prepare()) {
        return
      }
      // 2.下载模板
      if (this.projectInfo) {
        await this.downloadTemplate()
      }
      // 3.安装模板
      await this.installTemplate()
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
        return false
      }
    }
    // 2.选择创建项目或组件
    this.projectInfo = await this.getProjectInfo()
    return true
  }

  // 目录是否为空
  isDirEmpty() {
    const localPath = process.cwd()
    // 获取工作目录(哪里调用就在哪)
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
      const item = this.template.find(item => item.npm_name === projectInfo.projectTemplate)

      if (projectInfo.projectName) {
        projectInfo.projectName = kc(projectInfo.projectName).replace(/\^-/, '')
      }
      projectInfo.version = projectInfo.projectVersion
      return info = { ...projectInfo, projectType: TPYE_PROJECT, type: item.type }
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
      const spinner = spinnerStart('正在下载文件')
      try {
        await templateNpm.install()
        await sleep()
      } catch(e) {
        throw e
      } finally {
        spinner.stop(true)
        if (await templateNpm.exists()) {
          log.success('下载成功')
        }
      }
      
    } else {
      const spinner = spinnerStart('正在更新文件')
      try {
        await templateNpm.update()
        await sleep()
      } catch(e) {
        throw e
      } finally {
        spinner.stop(true)
        if (await templateNpm.exists()) {
          log.success('更新成功')
        }
      }
    }

    this.templateNpm = templateNpm
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

  // 安装模板
  async installTemplate() {
    if (!this.template) {
      return log.error('暂无获取在线模板')
    }

    // 安装标准模板
    if (this.projectInfo.type === TEMPLATE_TYPE_NORMAL) {
      await this.installNormalTemplate()
    
    // 安装自定义模板
    } else if (this.projectInfo.type === TEMPLATE_TYPE_CUSTOM) {
      await this.installCustomTemplate()
    } else {
      log.error('在线模板类型错误')
    }
  }

  // 安装默认模板
  async installNormalTemplate() {
    const spinner = spinnerStart('正在安装模板...')
    await sleep()

    try {
      const tempaltePath = path.resolve(this.templateNpm.getCacheFilePath(), 'template')
      const targetPath = process.cwd()
      fse.ensureDirSync(tempaltePath)
      fse.ensureDirSync(targetPath)
      fse.copySync(tempaltePath, targetPath)

      // 渲染copy后的模板
      const options = {
        ignore: ['node_modules/**', 'public/**']
      }
      await this.renderEjs(options)
    } catch(e) {
      throw e
    } finally {
      spinner.stop(true)
      log.success('模板安装成功')
    }
  }

  async installCustomTemplate() {
    console.log('安装自定义模板')
  }

  // 渲染Ejs模板
  async renderEjs(options) {
    return new Promise((resolve, reject) => {
      // 扫描当前工作目录文件
      glob('**', {
        cwd: process.cwd(),
        ignore: options.ignore,
        nodir: true
      }, (err, files) => {

        if (err) {
          reject(err)
        }

        const dir = process.cwd()
        // 全部重写
        Promise.all(files.map(file => {
          const filePath = path.join(dir, file)
          return new Promise((resolve1, reject1) => {
            ejs.renderFile(filePath, this.projectInfo, {}, (err, res) => {
              if (err) {
                reject1(err)
              } else {
                fse.writeFileSync(filePath, res)
                resolve1(res)
              }
            })
          })
        }))

        resolve()
        // console.log(files)
      })
    })
  }
}

function init(argv) {
  new InitCommand(argv)
}

module.exports = init;
module.exports.InitCommand = InitCommand