 'use strict';

const simpleGit = require('simple-git');
const userHome = require('user-home')
const path = require('path')
const fse = require('fs-extra')
const log = require('@paxiong-cli/log')
const fs = require('fs')
const inquirer = require('inquirer')
const terminalLink = require('terminal-link')
const { readFile, writeFile } = require('@paxiong-cli/utils')
const githubServer = require('./Github')
const giteeServer = require('./Gitee')
const DEFAULT_CLI_HOME = 'paxiong-cli'
const GIT_ROOT_DIR = '.git'
const GIT_SERVER_FILE = '.git_server'
const GIT_TOKEN_FILE = '.git_token'
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
        const { name, version, dir, resetServer, resetGitToken } = projectInfo
        this.name = name
        this.version = version
        this.dir = dir // 当前目录路径
        this.git = simpleGit(this.dir); // 创建git
        this.homePath = null // 用户主目录
        this.resetServer = resetServer // 重置gitServer
        this.resetGitToken = resetGitToken // 重置token
        this.gitServer = null // git服务
        this.uesr = null // 用户信息
        this.orgz = null // 组织信息
        
        // this.prepare()
        // this.init()
    }

    async prepare() {
        this.checkHomepath() // 缓存检查主目录
        await this.checkGitServer(this.resetServer) // 检查远程仓库平台并创建平台对象
        await this.checkGitToken() // 检查平台token
        await this.getUserAndOrgz() // 获取用户和组织信息
    }

    init () {
        console.log('init')
    }
    
     // 缓存检查主目录
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

    // 检查远程仓库平台并创建平台对象
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
        if (!this.gitServer) {
            throw Error('GitServer初始化失败')
        }
    }

     // 检查平台token
    async checkGitToken() {
        const tokenPath = this.createPath(GIT_TOKEN_FILE)
        let token = readFile(tokenPath)

        if (!token || this.resetGitToken) {
            log.warn(this.gitServer.type + ' token未生成', '请先生成 ' + this.gitServer.type + ' token '
            + terminalLink('链接', this.gitServer.getTokenHelpUrl()))

            token = (await inquirer.prompt({
                type: 'password',
                name: 'token',
                message: `请复制${this.gitServer.type}平台中的token`,
                default: ''
            })).token

            if (writeFile(tokenPath, token)) {
                log.success('token写入成功', `${this.gitServer.type} -> ${tokenPath}`)
            } else {
                throw Error('token写入失败')
            }

        } else {
            log.success('token获取成功', tokenPath)
        }
        this.gitServer.setToken(token)
    }

    // 获取用户和组织信息
    async getUserAndOrgz() {
        this.user = await this.gitServer.getUser()
        if (!this.user) {
            throw Error('获取用户信息失败')
        }

        this.orgz = await this.gitServer.getOrg(this.user.login)
        if (!this.orgz) {
            throw Error('获取组织信息失败')
        }

        log.success(this.gitServer.type + ' 用户和组织信息获取成功')
    }

    createPath(file) {
        const rootDir = path.resolve(this.homePath, GIT_ROOT_DIR)
        const filePath = path.resolve(rootDir, file)
        fse.ensureDirSync(rootDir)
        return filePath
    }

    createGitServer(gitServer) {
        if (gitServer === GITHUB) {
            return new githubServer()
        } else if (gitServer === GITEE) {
            return new giteeServer()
        }
        return null
    }
}

module.exports = Git;

