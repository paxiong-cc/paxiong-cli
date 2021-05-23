const request = require('@paxiong-cli/request')

module.exports = function() {
  return request({
    url: '/common/npm/list'
  })
}