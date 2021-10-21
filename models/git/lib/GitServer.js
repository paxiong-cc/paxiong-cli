'use strict';
function error(method) {
  throw Error(`请重写${method}方法`)
}

class GitServer {
  constructor(type, token) {
    this.type = type
    this.token = token
  }

  setGitToken(token) {
    this.token = token
  }

  getSSHkeysUrl() {
    error('getSSHkeysUrl');
  }

  getTokenHelpUrl() {
    error('getTokenHelpUrl');
  }

  getUser() {
    error('getUser');
  }

  getOrg() {
    error('getOrg');
  }
}

module.exports = GitServer