'use strict';
const BASE_URL = 'https://api.github.com'
const axios = require('axios')

class GitHubRequest {
  constructor(token) {
    this.token = token
    this.service = axios.create({
      baseURL: BASE_URL,
      timeout: 5000
    })
    this.service.interceptors.request.use(
      config => {
        config.headers['Authorization'] = `token ${this.token}`
        return config
      },
      error => {
        Promise.reject(error)
      }
    )

    this.service.interceptors.response.use(
      response => {
        return response.data
      },
      error => {
        if (error.response && error.response.data) {
          return error.response
        } else {
          return Promise.reject(error)
        }
      }
    )
  }

  get(url, params, headers) {
    return this.service({
      url,
      params,
      method: 'get',
      headers
    })
  }

  post(url, data, headers) {
    return this.service({
      url,
      data,
      method: 'post',
      headers
    })
  }
}

module.exports = GitHubRequest