var path = require('path'),
    fs = require('fs'),
    exec = require('child_process').exec,
    moment = require('moment'),
    config = require('./config'),
    chatId = config.chat.id,
    cameraUrl = config.camera.baseUrl,
    Utils = require('./lib/Utils'),
    Errors = require('./lib/errors'),
    log = require('debug')(config.debug.tag + ':cmds'),
    takePhotoCmds = ['take a photo', 'take a picture'],
    showVideoComds = ['show me the video'],
    sendPhoto = function(socket) {

        var photoPath = path.resolve(__dirname, 'camera/' + moment().format('YYYY-MM-DD-hhmmss') + '.jpg')
        var process = exec('fswebcam -p YUYV -d /dev/video0 -r 320x240 ' + photoPath, function(err, stdout, stderr) {
            log('stdout: ' + stdout)
            log('stderr: ' + stderr)
            if(!err) {
                var base64 = Utils.toDataString(photoPath)
                socket.emit('messages/create', {
                    'chatId': chatId,
                    'data': base64,
                    'mime': 'image/png',
                    'encoding': 'base64'
                }, function(data) {
                    if(data.code !== 200) log(Errors.SEND_FAILED)
 	 	    log('sent successfully')
                })
            }
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
