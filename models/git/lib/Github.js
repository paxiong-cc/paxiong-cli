'use strict';

const GitServer = require('./GitServer')
const GitHubRequest = require('./GihubRequest')
class GitHub extends GitServer {
  constructor() {
    super('github')
    this.request = null
  }

  setToken(token) {
    super.setGitToken(token)
    this.request = new GitHubRequest(token)
  }

  // 获取用户信息
  getUser() {
    return this.request.get('/user')
      .then(res => {
        if (res.status == 401) {
          return false
        }
        return res
      })
      .catch(err => {
        console.log(err)
      })
  }

  /**
   * 获取组织
   * @param {*} username 用户名
   */
  getOrg(username) {
    return this.request.get(`/users/${username}/orgs`, {
      page: 1,
      per_page: 100
    })
    .then(res => {
      if (res.status == 401) {
        return false
      }
      return res
    })
    .catch(err => {
      console.log(err)
    })
  }

  /**
   * 获取远程仓库
   * @param {string} login 登录仓库的用户名
   * @param {string} name package.json 中的项目名称
   */
  getRepo(login, name) {
    return this.request
      .get(`/repos/${login}/${name}`)
      .then(res => {
        if (res.status === 404)  {
          return null
        }
        return res
      })
      .catch(err => {
        return null
      })
  }

  /**
   * 创建个人远程仓库
   * @param {string} name 仓库名
   */
  createRepo(name) {
    return this.request.post('/user/repos', {
      name
    })
    .then(res => {
      if (res.status) {
        return null
      }
      return res
    })
    .catch(err => {
      return null
    })
  }

  /**
   * 创建组织远程仓库
   * @param {string} name 仓库名
   * @param {string} login 用户名
   */
  createOrgRepo(name, login) {
    return this.request.post(`/orgs/${login}/repos`, {
      name
    })
    .then(res => {
      if (res.status) {
        return null
      }
      return res
    })
    .catch(err => {
      return null
    })
  }

  getSSHkeysUrl() {
    return 'https://github.com/settings/keys'
  }

  getTokenHelpUrl() {
    return 'https://docs.github.com/en/authentication/connecting-to-github-with-ssh'
  }
}

module.exports = GitHub