var path = require('path'),
    fs = require('fs'),
    config = require('./config'),
    chatId = config.chat.id,
    cameraUrl = config.camera.baseUrl,
    Utils = require('./lib/Utils'),
    Errors = require('./lib/errors'),
    log = require('debug')(config.debug.tag + ':cmds'),
    takePhotoCmds = ['take a photo', 'take a picture'],
    showVideoComds = ['show me the video'],
    sendPhoto = function(socket) {
        var test = 'photo.png'
        var base64 = Utils.toDataString(path.resolve(__dirname, test))
        socket.emit('messages/create', {
            'chatId': chatId,
            'data': base64,
            'mime': 'image/png',
            'encoding': 'base64'
        }, function(data) {
            if(data.code !== 200) log(Errors.SEND_FAILED)
        })
    },
    sendLink = function(socket) {
        socket.emit('messages/create', {
            'chatId': chatId,
            'data': cameraUrl,
            'mime': 'text/plain',
            'encoding': 'utf8',
            'meta': { 'type': 'stream' }
        }, function(data) {
            if(data.code !== 200) log(Errors.SEND_FAILED)
        })
    };

module.exports = {
    get: function(str) {
        for(var i = 0 , len = takePhotoCmds.length; i < len; i++) {
            if(str.indexOf(takePhotoCmds[i]) > -1) return {
                'command': takePhotoCmds[i],
                'action': sendPhoto
            }
        }
        for(var i = 0 , len = showVideoComds.length; i < len; i++) {
            if(str.indexOf(showVideoComds[i]) > -1) return {
                'command': showVideoComds[i],
                'action': sendLink
            }
        }
        return null
    }
}
