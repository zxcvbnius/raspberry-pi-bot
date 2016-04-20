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
    startPlayingComds = ['play the video'],
    stopPlayingComds = ['stop', 'stop playing'],
    isPlaying = false,
    sendPhoto = function(socket) {

        var photoPath = path.resolve(__dirname, 'camera/' + moment().format('YYYY-MM-DD-hhmmss') + '.jpg')
        var process = exec('fswebcam -p YUYV -d /dev/video0 -r 640x480 ' + photoPath, function(err, stdout, stderr) {
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
    startPlaying = function(socket) {
        if(isPlaying) {
            var data = 'The video is playing, you can watch the video from ' + cameraUrl
            socket.emit('messages/create', {
                'chatId': chatId,
                'data': cameraUrl,
                'mime': 'text/plain',
                'encoding': 'utf8',
                'meta': { 'type': 'stream' }
            }, function(data) {
                if(data.code !== 200) log(Errors.SEND_FAILED)
                log('sent successfully')
            })
        }
        else {
            isPlaying = true
            var process = exec('mjpg-streamer/mjpg-streamer.sh start', function(err, stdout, stderr) {
                log('stdout: ' + stdout);log('stderr: ' + stderr);
                if(!err) { debug(err) }})
            var data = 'Now is' + moment().format('YYYY-MM-DD-hh:mm:ss') + '. If you want to stop the video, just typing \'stop playing\' <(￣V￣)>'
            socket.emit('messages/create', {
                'chatId': chatId,
                'data': cameraUrl,
                'mime': 'text/plain',
                'encoding': 'utf8',
                'meta': { 'type': 'stream' }
            }, function(data) {
                if(data.code !== 200) log(Errors.SEND_FAILED)
                log('sent successfully')
            })
        }
    },
    stopPlaying = function(socket) {
        if(!isPlaying) {
            var data = 'No video is playing now, silly goose -_-'
            socket.emit('messages/create', {
                'chatId': chatId,
                'data': data,
                'mime': 'text/plain',
                'encoding': 'utf8',
                'meta': { 'type': 'stream' }
            }, function(data) {
                if(data.code !== 200) log(Errors.SEND_FAILED)
                log('sent successfully')
            })
        }
        else {
            isPlaying = false
            var process = exec('mjpg-streamer/mjpg-streamer.sh stop', function(err, stdout, stderr) {
                log('stdout: ' + stdout)
                log('stderr: ' + stderr)
                if(!err) {}})
            var data = 'Ok, already stopped playing the video <(￣O￣)>'
            socket.emit('messages/create', {
                'chatId': chatId,
                'data': cameraUrl,
                'mime': 'text/plain',
                'encoding': 'utf8',
                'meta': { 'type': 'stream' }
            }, function(data) {
                if(data.code !== 200) log(Errors.SEND_FAILED)
 	        log('sent successfully')
            })
        }
    };

module.exports = {
    get: function(str) {
        str = str.toLowerCase()
        for(var i = 0 , len = takePhotoCmds.length; i < len; i++) {
            if(str.indexOf(takePhotoCmds[i]) > -1) return {
                'text': takePhotoCmds[i],
                'action': sendPhoto
            }
        }
        for(var i = 0 , len = startPlayingComds.length; i < len; i++) {
            str = str.toLowerCase()
            if(str.indexOf(startPlayingComds[i]) > -1) return {
                'text': startPlayingComds[i],
                'action': startPlaying
            }
        }
        for(var i = 0 , len = stopPlayingComds.length; i < len; i++) {
            str = str.toLowerCase()
            if(str.indexOf(stopPlayingComds[i]) > -1) return {
                'text': stopPlayingComds[i],
                'action': stopPlaying
            }
        }
        return null
    }
}
