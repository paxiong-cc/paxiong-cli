'use strict';

const GitServer = require('./GitServer')
const GiteeRequest = require('./GiteeRequest')

class Gitee extends GitServer {
  constructor() {
    super('gitee')
    this.request = null
  }

  setToken(token) {
    super.setGitToken(token)
    this.request = new GiteeRequest(token)
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
   * 创建远程仓库
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

  getRemote(login, name) {
    // git@gitee.com:paxiong-cus/abc.git
    return `git@gitee.com:${login}/${name}.git`
  }

  getSSHkeysUrl() {
    return 'https://gitee.com/profile/sshkeys'
  }

  getTokenHelpUrl() {
    return 'https://gitee.com/help/articles/4191'
  }
}

module.exports = Gitee