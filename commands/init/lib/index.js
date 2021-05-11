'use strict';

const Command = require('@paxiong-cli/command')
const log = require('@paxiong-cli/log')
class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || ''
    this.force = !!this._argv[1]
    log.verbose('projectName', this.projectName)
    log.verbose('force', this.force)
  }

  exec() {
    console.log(55)
  }
}

function init(argv) {
  new InitCommand(argv)
}

module.exports = init;
module.exports.InitCommand = InitCommand