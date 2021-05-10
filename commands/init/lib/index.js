'use strict';

const Command = require('@paxiong-cli/command')

class InitCommand extends Command {

}

function init(argv) {
  new InitCommand(argv)
}

module.exports = init;
module.exports.InitCommand = InitCommand