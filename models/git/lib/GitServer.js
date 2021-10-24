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

  /**
   * 获取远程仓库
   * @param {string} login 登录仓库的用户名
   * @param {string} name package.json 中的项目名称
   */
  getRepo(login, name) {
    error('getRepo');
  }

  createRepo(name) {
    error('createRepo');
  }

  createOrgRepo(name, login) {
    error('createOrgRepo');
  }
}

module.exports = GitServer