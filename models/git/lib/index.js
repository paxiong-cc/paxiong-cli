'use strict';

const simpleGit = require('simple-git');
const userHome = require('user-home')
const path = require('path')
const fse = require('fs-extra')
const log = require('@paxiong-cli/log')
const fs = require('fs')
const inquirer = require('inquirer')
const { readFile, writeFile } = require('@paxiong-cli/utils')
const DEFAULT_CLI_HOME = 'paxiong-cli'
const GIT_ROOT_DIR = '.git'
const GIT_SERVER_FILE = '.git_server'
const GITHUB = 'github' 
const GITEE = 'gitee'

const GIT_PLATE_CHOICE = [
    {
        name: 'github',
        value: GITHUB
    },
    {
        name: 'gitee',
        value: GITEE
    }
]

class Git {
    constructor(projectInfo) {
        const { name, version, dir } = projectInfo
        this.name = name
        this.version = version
        this.dir = dir // 当前目录路径
        this.git = simpleGit(this.dir); // 创建git
        this.homePath = null // 用户主目录
        
        this.prepare()
        this.init()
    }

    async prepare() {
        this.checkHomepath() // 缓存检查主目录
    }

    init () {
        console.log('init')
    }
    
    checkHomepath() {
        if (!this.homePath) {
            if (process.env.CLI_HOME_PATH) {
                this.homePath = process.env.CLI_HOME_PATH
            } else {
                this.homePath = path.resolve(userHome, DEFAULT_CLI_HOME)
            }
        }

        log.verbose('homePath', this.homePath)
        fse.ensureDirSync(this.homePath)
        if (!fs.existsSync(this.homePath)) {
            throw Error('获取用户主目录失败！')
        }
    }

    // 检查远程仓库
    async checkGitServer(resetServer) {
        // 读取或写入平台信息
        const gitServerPath = this.createPath(GIT_SERVER_FILE)
        let gitServer = readFile(gitServerPath) // 读取的内容
        if (!gitServer || resetServer) {
            gitServer = (await inquirer.prompt({
                type: 'list',
                name: 'gitServer',
                message: '请选择初始化类型',
                default: GITHUB,
                choices: GIT_PLATE_CHOICE
            })).gitServer

            writeFile(gitServerPath, gitServer)
            log.success('git server写入成功', `${gitServer} -> ${gitServerPath}`)
        } else {
            log.success('git server获取成功', `${gitServer} -> ${gitServerPath}`)
        }

        // 创建gitServer对象
        this.gitServer = this.createGitServer(gitServer)
    }

    createPath(file) {
        const rootDir = path.resolve(this.homePath, GIT_ROOT_DIR)
        const filePath = path.resolve(rootDir, file)
        fse.ensureDirSync(rootDir)
        return filePath
    }

    createGitServer() {

    }
}

module.exports = Git;

