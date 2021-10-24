 'use strict';

const simpleGit = require('simple-git');
const userHome = require('user-home')
const path = require('path')
const fse = require('fs-extra')
const log = require('@paxiong-cli/log')
const fs = require('fs')
const inquirer = require('inquirer')
const terminalLink = require('terminal-link')
const { readFile, writeFile, spinnerStart, sleep } = require('@paxiong-cli/utils')
const githubServer = require('./Github')
const giteeServer = require('./Gitee')
const DEFAULT_CLI_HOME = 'paxiong-cli'
const GIT_ROOT_DIR = '.git'
const GIT_SERVER_FILE = '.git_server' // 平台
const GIT_TOKEN_FILE = '.git_token' // access_token
const GIT_OWN_FILE = '.git_own'
const GIT_LOGIN_FILE = '.git_login'
const GITIGNORE = '.gitignore'

const GITHUB = 'github' 
const GITEE = 'gitee'
const REPO_OWNER_USER = 'user'
const REPO_OWNER_ORG = 'org'

// 平台
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

// 仓库类型
const GIT_OWNER_TYPE = [
    {
        name: '个人',
        value: REPO_OWNER_USER
    },
    {
        name: '组织',
        value: REPO_OWNER_ORG
    },
]
const GIT_OWNER_TYPE_ONLY = [
    {
        name: '个人',
        value: REPO_OWNER_USER
    }
]

class Git {
    constructor(projectInfo) {
        const { name, version, dir, resetServer, resetGitToken, resetOwner, resetLogin } = projectInfo
        this.name = name // 项目名称
        this.version = version
        this.dir = dir // 当前目录路径
        this.git = simpleGit(this.dir); // 创建git
        this.homePath = null // 用户主目录
        this.resetServer = resetServer // 重置gitServer
        this.resetGitToken = resetGitToken // 重置token
        this.resetOwner = resetOwner // 是否重置git远程仓库类型
        this.resetLogin = resetLogin // 是否重置git平台远程仓库登录名
        this.gitServer = null // git服务
        this.uesr = null // 用户信息
        this.orgz = null // 组织信息
        this.owner = null // 远程仓库类型
        this.login = null // 远程仓库登录名(用户名)
        this.repo = null // 远程仓库信息
    }

    async prepare() {
        this.checkHomepath() // 缓存检查主目录
        await this.checkGitServer(this.resetServer) // 检查远程仓库平台并创建平台对象
        await this.checkGitToken() // 检查平台token
        await this.getUserAndOrgz() // 获取用户和组织信息
        await this.checkGitOwner() // 确认远程仓库类型
        await this.checkRepo() // 检查并创建远程仓库
        this.checkGitIgnore() // 检查仓库.gitignore
        await this.init()
    }

    async init() {
        if (await this.getRemote()) {
            // return
        }
        // 初始化远程仓库地址
        await this.initAndAddRemote()
        // 初始化commit信息
        await this.initCommit()
    }

    // 获取远程仓库地址，并查看是否创建.git
    async getRemote() {
        const gitPath = path.resolve(this.dir, GIT_ROOT_DIR)
        this.remote = this.gitServer.getRemote(this.login, this.name)
        if (fs.existsSync(gitPath)) {
            log.success('git已完成初始化')
            return true
        }
    }

    // 初始化和添加远程地址
    async initAndAddRemote() {
        log.info('执行git初始化')
        await this.git.init(this.dir)

        log.info('添加git remote')
        const remotes = await this.git.getRemotes()

        log.verbose('git remotes', remotes)

        if (!remotes.find(item => item.name === 'origin')) {
            await this.git.addRemote('origin', this.remote)
        }
    }

    // 初始化commit信息
    async initCommit() {
        await this.checkConflicted()
        await this.checkNotCommitted()
        if (await this.checkRemoteMaster()) {
            // 允许提交历史不同的相容
            await this.pullRemoteRepo('master', {
                '--allow-unrelated-histories': null
            })
        } else {
            await this.pushRemoteRepo('master')
        }
    }

    // 拉取远程代码
    async pullRemoteRepo(branchName, options) {
        log.info(`同步远程${branchName}分支代码`)
        await this.git.pull('origin', branchName, options)
            .catch(err => {
                log.error(err.message)
            })
    }

    // 检查远程仓库分支列表
    async checkRemoteMaster() {
        // git ls-remote --refs
        return (await this.git.listRemote(['--refs'])).indexOf('refs/heads/master') >= 0
    }

    // 推送代码
    async pushRemoteRepo(branchName) {
        log.info(`推送代码至${branchName}分支`)
        await this.git.push('origin', branchName)
        log.success('推送代码成功')
    }

    // 检查代码冲突
    async checkConflicted() {
        log.info('代码冲突检查')
        const status = await this.git.status()
        if (status.conflicted.length > 0) {
            throw Error('当前代码存在冲突, 请手动处理合并后再试!')
        }
        log.success('代码冲突检查通过')
    }

    // 检查是否有commit提交信息
    async checkNotCommitted() {
        const status = await this.git.status()
        // 存在变动信息
        if (status.not_added.length > 0
            || status.created.length > 0
            || status.deleted.length > 0    
            || status.modified.length > 0    
            || status.renamed.length > 0    
        ) {
            log.verbose('status', status)
            await this.git.add(status.not_added)
            await this.git.add(status.created)
            await this.git.add(status.deleted)
            await this.git.add(status.modified)
            await this.git.add(status.renamed)

            let message
            while (!message) {
                message = (await inquirer.prompt({
                    type: 'text',
                    name: 'message',
                    message: '请输入commit信息: ',
                })).message
            }

            await this.git.commit(message)
            log.success('本次commit提交成功')
        }
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
        log.verbose('用户信息', this.user)

        this.orgz = await this.gitServer.getOrg(this.user.login)
        if (!this.orgz) {
            throw Error('获取组织信息失败')
        }
        log.verbose('组织信息', this.orgz)
        log.success('获取' + this.gitServer.type + ' 用户和组织信息获取成功')
    }

    // 确认远程仓库类型
    async checkGitOwner() {
        const ownerPath = this.createPath(GIT_OWN_FILE)
        const loginPath = this.createPath(GIT_LOGIN_FILE)
        let owner = readFile(ownerPath)
        let login = readFile(loginPath)
        
        if (!owner || !login || this.resetOwner || this.resetLogin) {
            console.log(this.orgz, this.user)
            owner = (await inquirer.prompt({
                type: 'list',
                name: 'owner',
                message: `请选择远程仓库类型`,
                default: REPO_OWNER_USER,
                choices: this.orgz.length > 0 ? GIT_OWNER_TYPE : GIT_OWNER_TYPE_ONLY
            })).owner

            if (owner === REPO_OWNER_USER) {
                login = this.user.login
            } else {
                login = (await inquirer.prompt({
                    type: 'list',
                    name: 'login',
                    message: `请选择`,
                    default: REPO_OWNER_USER,
                    choices: this.orgz.map(item => ({
                        name: item.login,
                        value: item.login
                    }))
                })).login
            }
            writeFile(ownerPath, owner)
            writeFile(loginPath, login)

            log.success('owner写入成功', `${owner} -> ${ownerPath}`)
            log.success('login写入成功', `${login} -> ${loginPath}`)
        } else {
            log.success('owner获取成功', owner)
            log.success('login获取成功', login)
        }

        this.owner = owner
        this.login = login
    }

    // 检查并创建远程仓库
    async checkRepo() {
        let repo = await this.gitServer.getRepo(this.login, this.name)

        if (!repo) {
            let spinner = spinnerStart('开始创建远程仓库...')
            await sleep()
            try {
                // 如果是个人仓库
                if (this.owner === REPO_OWNER_USER) {
                    repo = this.gitServer.createRepo(this.name)

                // 如果是组织仓库
                } else {
                    repo = this.gitServer.createOrgRepo(this.name, this.login)
                }

            } catch(e) {
                log.error(e)

            } finally {
                spinner.stop(true)
            }

            if (repo) {
                log.success('远程仓库创建成功')
            } else {
                throw Error('远程仓库创建失败')
            }

        } else {
            log.success('远程仓库信息获取成功')
        }

        log.verbose('repo', repo)
        this.repo = repo
    }

    // 检查.gitignore文件
    checkGitIgnore() {
        const ignorePath = path.resolve(this.dir, GITIGNORE)

        if (!fs.existsSync(ignorePath)) {
            writeFile(ignorePath, `.vscode
            .idea
            node_modules
            
            lerna-debug.log`)
            log.success('写入.gitignore成功')
        }
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

