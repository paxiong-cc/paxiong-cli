'use strict';

const Command = require('@paxiong-cli/command')
const log = require('@paxiong-cli/log')
const fse = require('fs-extra')
const Git = require('@paxiong-cli/git')

class PublishCommand extends Command {
    init() {
        // 是否重新写入平台
        this.resetServer = !!this._argv.resetGitServer
        console.log(this._argv, this._cmd)
    }

    async exec() {
        try {
            const startTime = new Date().getTime();

            // 初始化检查
            this.prepare()
            
            // Git Flow自动化
            const git = new Git(this.projectInfo)
            await git.checkGitServer(this.resetServer) // 检查用户远程仓库类型

            // 云构建和云发布
            const endTime = new Date().getTime();
            log.info('本次发布耗时', Math.floor((endTime - startTime) / 1000) + 's')
        } catch (e) {
            log.error(e.message)
            if (process.env.LOG_LEVEL === 'verbose') {
                console.log(e)
            }
        }
    }

    prepare() {
        // 1.确认项目是否为npm项目
        const projectPath = process.cwd()
        const pkgPath = path.resolve(projectPath, 'package.json')
        log.verbose('package.json', pkgPath)
        if (!fs.existsSync(pkgPath)) {
            throw Error('package.json不存在!')
        }

        // 2.确认是否包含name、version、build命令
        const pkg = fse.readJsonSync(pkgPath)
        const { name, version, scripts } = pkg
        log.verbose('package.json', name, version, scripts)

        if (!name || !version || !scripts || !scripts.build) {
            throw Error('package.json 信息不全, 请检查是否存在name、version和scripts(需要提供build命令)')
        }

        this.projectInfo = { name, version, dir: projectPath }
        log.verbose('projectInfo', JSON.stringify(this.projectInfo))
    }
}

function init (argv) {
   new PublishCommand(argv)
}

module.exports = init
module.exports.PublishCommand = PublishCommand
