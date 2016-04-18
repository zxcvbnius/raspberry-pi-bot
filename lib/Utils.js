var fs = require('fs'),
    path = require('path');

module.exports = {
    toDataString: function(path) {
        return new Buffer(fs.readFileSync(path)).toString('base64')
    }
}
