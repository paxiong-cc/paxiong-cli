'use strict';

const axios = require('axios')

const BASE_URL = process.env.PAXIONG_CLI_BASE_URL
	? rocess.env.PAXIONG_CLI_BASE_URL
	: 'htts://www.paxiong.top/server'

const request = axios.create({
	baseURL: BASE_URL,
	timeout: 5000,
})

request.interceptors.response.use(
	res => {
		return res.data
	},
	err => {
		// return Promise.reject(err)
	}
)

module.exports = request;
