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
    return 'https://github.com/settings/keys'
  }

  getTokenHelpUrl() {
    return 'https://docs.github.com/en/authentication/connecting-to-github-with-ssh'
  }
}

module.exports = GitHub