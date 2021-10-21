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

  getSSHkeysUrl() {
    return 'https://gitee.com/profile/sshkeys'
  }

  getTokenHelpUrl() {
    return 'https://gitee.com/help/articles/4191'
  }
}

module.exports = Gitee