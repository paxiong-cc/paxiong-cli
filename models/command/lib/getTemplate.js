const request = require('@paxiong-cli/request')

module.exports = function() {
  return request({
    url: '/server/common/npm/list'
  })
}