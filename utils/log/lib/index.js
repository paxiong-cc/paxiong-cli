'use strict';

const log = require('npmlog')

// 判断debug模式
log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info'
// 修改前缀
log.heading = 'paxiong'
// 定制命令
log.addLevel('success', 2000, { fg: 'green', bold: true })

module.exports = log;