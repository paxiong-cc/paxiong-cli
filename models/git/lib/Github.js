'use strict';

const GitServer = require('./GitServer')

class GitHub extends GitServer {
  constructor() {
    super('github')
  }

  getSSHkeysUrl() {
    return 'https://github.com/settings/keys'
  }

  getTokenHelpUrl() {
    return 'https://docs.github.com/en/authentication/connecting-to-github-with-ssh'
  }
}

module.exports = GitHub