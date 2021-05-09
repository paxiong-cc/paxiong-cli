'use strict';

const path = require('path')

module.exports = function(path) {
	if (path && typeof path === 'string') {
		const sep = path.sep

		if (sep === '/') {
			return path
		} else {
			return path.replace(/\\/g, '/')
		}
	}

	return path
};

