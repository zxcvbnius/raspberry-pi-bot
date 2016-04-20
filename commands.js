var path = require('path'),
    fs = require('fs'),
    exec = require('child_process').exec,
    moment = require('moment'),
    Promise = require('bluebird'),
    config = require('./config'),
    chatId = config.chat.id,
    cameraUrl = config.camera.baseUrl,
    Utils = require('./lib/Utils'),
    Errors = require('./lib/errors'),
    log = require('debug')(config.debug.tag + ':cmds'),
    takePhotoCmds = ['take a photo', 'take a picture', 'take photo'],
    askTakingPhotoCmds = ['could you take a photo'],
    startPlayingCmds = ['play the video', 'play video'],
    stopPlayingCmds = ['stop', 'stop playing'],
    timeCmds = ['what time', 'time'],
    isPlaying = false,
    sendCommand = function(text) {
        return new Promise(function(resolve, reject) {
            socket.emit('messages/create', {
                'chatId': chatId,
                'data': text,
                'mime': 'text/plain',
                'encoding': 'utf8'
            }, function(data) {
                if(data.code !== 200) {reject(Errors.SEND_FAILED); log(Errors.SEND_FAILED);}
                else resolve()
            })
        })
    },
    showTime = function(socket) {
        var data = 'Today is ' + moment().format('YYYY/MM/DD') + '.\n'
        + 'Now is ' + moment().format('hh:mm:ss') + '. It\'s time for launch~~'
        sendCommand(data)
    },
    sendPhoto = function(socket) {
        var photoPath = path.resolve(__dirname, 'camera/' + moment().format('YYYY-MM-DD-hhmmss') + '.jpg')
        var process = exec('fswebcam -p YUYV -d /dev/video0 -r 640x480 ' + photoPath, function(err, stdout, stderr) {
            log('stdout: ' + stdout); log('stderr: ' + stderr);
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
    askTakingPhoto = function(socket) {
        sendCommand('of course! wait a minute ~')
        .then(function() {
            var photoPath = path.resolve(__dirname, 'camera/' + moment().format('YYYY-MM-DD-hhmmss') + '.jpg')
            var process = exec('fswebcam -p YUYV -d /dev/video0 -r 640x480 ' + photoPath, function(err, stdout, stderr) {
                log('stdout: ' + stdout); log('stderr: ' + stderr);
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
        })
        .catch(function(err) {})
    },
    startPlaying = function(socket) {
        if(isPlaying) {
            var data = 'The video is playing, you can watch the video from ' + cameraUrl
            sendCommand(data)
        }
        else {
            isPlaying = true
            var process = exec('mjpg-streamer/mjpg-streamer.sh start', function(err, stdout, stderr) {
                log('stdout: ' + stdout);log('stderr: ' + stderr);
                if(!err) { debug(err) }})
            var data = 'Now is' + moment().format('YYYY-MM-DD-hh:mm:ss') + '.\nIf you want to stop the video, just typing stop' //<(￣V￣)>
            sendCommand(data)
        }
    },
    stopPlaying = function(socket) {
        if(!isPlaying) {
            var data = 'OhOh~\nNo video is playing now\nsilly goose -_-'
            sendCommand(data)
        }
        else {
            isPlaying = false
            var process = exec('mjpg-streamer/mjpg-streamer.sh stop', function(err, stdout, stderr) {
                log('stdout: ' + stdout); log('stderr: ' + stderr);
                if(!err) {}})
            var data = 'Ok! Already stopped playing the video\n<(￣O￣)>'
            sendCommand(data)
        }
    };

module.exports = {
    get: function(str) {
        str = str.toLowerCase()
        askTakingPhotoCmds
        for(var i = 0 , len = askTakingPhotoCmds.length; i < len; i++) {
            if(str.indexOf(askTakingPhotoCmds[i]) > -1) return {
                'text': askTakingPhotoCmds[i],
                'action': askTakingPhoto
            }
        }
        for(var i = 0 , len = takePhotoCmds.length; i < len; i++) {
            if(str.indexOf(takePhotoCmds[i]) > -1) return {
                'text': takePhotoCmds[i],
                'action': sendPhoto
            }
        }
        for(var i = 0 , len = startPlayingCmds.length; i < len; i++) {
            str = str.toLowerCase()
            if(str.indexOf(startPlayingCmds[i]) > -1) return {
                'text': startPlayingCmds[i],
                'action': startPlaying
            }
        }
        for(var i = 0 , len = stopPlayingCmds.length; i < len; i++) {
            str = str.toLowerCase()
            if(str.indexOf(stopPlayingCmds[i]) > -1) return {
                'text': stopPlayingCmds[i],
                'action': stopPlaying
            }
        }
        for(var i = 0 , len = timeCmds.length; i < len; i++) {
            str = str.toLowerCase()
            if(str.indexOf(timeCmds[i]) > -1) return {
                'text': timeCmds[i],
                'action': showTime
            }
        }
        return null
    }
}
