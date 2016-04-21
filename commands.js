var path = require('path'),
    fs = require('fs'),
    exec = require('child_process').exec,
    moment = require('moment'),
    _ = require('lodash'),
    Promise = require('bluebird'),
    config = require('./config'),
    chatId = config.chat.id,
    cameraUrl = config.camera.baseUrl,
    Utils = require('./lib/Utils'),
    Errors = require('./lib/errors'),
    request = require('superagent'),
    log = require('debug')(config.debug.tag + ':cmds'),

    takePhotoCmds = ['take a photo', 'take a picture', 'take photo'],
    askTakingPhotoCmds = ['could you take a photo'],
    startPlayingCmds = ['play the video', 'play video'],
    stopPlayingCmds = ['stop playing'],
    timeCmds = ['what time', 'time'],
    statusCmds = ['status'],
    helpCmds = ['help'],
    startMotionCmd = ['start detecting', 'start detecting'],
    stopMotionCmd = ['stop detecting', 'stop detecting'],

    isPlaying = false,
    isMotionDetecting = false,
    sendCommand = function(socket, text) {
        return new Promise(function(resolve, reject) {
            socket.emit('messages/create', {
                'chatId': chatId,
                'data': text,
                'mime': 'text/plain',
                'encoding': 'utf8'
            }, function(data) {
                if(data.code !== 200) {reject(Errors.SEND_FAILED); log(Errors.SEND_FAILED);}
                else {resolve(); }
            })
        })
    },
    showTime = function(socket) {
        var data = 'Today is ' + moment().format('YYYY/MM/DD') + '.\n'
        + 'Now is ' + moment().format('hh:mm:ss') + '. It\'s time for launch~~'
        sendCommand(socket, data)
    },
    takePhoto = function(socket) {
        return new Promise(function(resolve, reject) {
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
                        if(data.code !== 200) {reject(Errors.SEND_FAILED); log(Errors.SEND_FAILED);}
                        else resolve()
                    })
                }
            })
        })
    },
    sendPhoto = function(socket) {
        if(isPlaying) {
            var process = exec('mjpg-streamer/mjpg-streamer.sh stop', function(err, stdout, stderr) {})
            sendCommand(socket, 'wait a minute ~')
            .then(function() {
                sleep(3000)
                return takePhoto(socket)
            })
            .then(function() {
                var process = exec('mjpg-streamer/mjpg-streamer.sh start', function(err, stdout, stderr) {})
            })
        }else {
            takePhoto(socket)
        }
    },
    askTakingPhoto = function(socket) {
        sendCommand(socket, 'of course! wait a minute ~')
        .then(function() {
            sendPhoto(socket)
        })
        .catch(function(err) {})
    },
    startPlaying = function(socket) {
        if(isMotionDetecting) {
            var data = 'You should turn off detecting motion first'
            sendCommand(socket, data)
        }
        else if(isPlaying) {
            var data = 'The video is playing, you can watch the video from ' + cameraUrl
            sendCommand(socket, data)
        }
        else {
            isPlaying = true
            var process = exec('mjpg-streamer/mjpg-streamer.sh start', function(err, stdout, stderr) {
                log('stdout: ' + stdout);log('stderr: ' + stderr); if(err) { log(err) }})
            var data = 'Now is' + moment().format('YYYY-MM-DD-hh:mm:ss') + '.\nIf you want to stop the video, just typing stop playing' //<(￣V￣)>
            sendCommand(socket, data)
        }
    },
    stopPlaying = function(socket) {
        if(!isPlaying) {
            var data = 'OhOh~\nNo video is playing now\nsilly goose -_-'
            sendCommand(socket, data)
        }
        else {
            isPlaying = false
            var process = exec('mjpg-streamer/mjpg-streamer.sh stop', function(err, stdout, stderr) {
                log('stdout: ' + stdout); log('stderr: ' + stderr); if(!err) {}})
            var data = 'Ok! Already stopped playing the video\n<(￣O￣)>'
            sendCommand(socket, data)
        }
    },
    startMotion = function(socket) {
        isMotionDetecting = true
        if(!isPlaying) {
            exec('sudo service motion restart', function(err, stdout, stderr) {})
            sendCommand(socket, 'Start detecting')
        } else {
            var process = exec('mjpg-streamer/mjpg-streamer.sh stop', function(err, stdout, stderr) {
                log('stdout: ' + stdout); log('stderr: ' + stderr); if(!err) {}})
            sendCommand(socket, 'wait a minute ~')
            .then(function() {
                sleep(3000)
                exec('sudo service motion restart', function(err, stdout, stderr) {})
            })
        }
        motionListener(socket)
    },
    stopMotion = function(socket) {
        if(!isMotionDetecting) {
            var data = 'OhOh~\n I am not detecting now.\nsilly goose -_-'
            sendCommand(socket, data)
        } else {
            exec('sudo service motion stop', function(err, stdout, stderr) {})
            sendCommand(socket, 'Stop detecting! Wish you have a good day Momo!')
        }
        isMotionDetecting = false
    },
    status = function(socket) {
        var data = `CPU usage:
%Cpu(s):  0.2 us,  0.2 sy,  0.0 ni, 99.5 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0
KiB Mem:    882884 total,   232996 used,   649888 free,    18164 buffers
KiB Swap:   102396 total,        0 used,   102396 free.   134300 cached Mem
===============
Filesystem:
Size Used Avail Use%
7.2G 2.9G 4.0G 42%`
        sendCommand(socket, data)
        /*
        exec('df -h', function(err, stdout, stderr) {
            data = stdout; log('stdout: ' + stdout);
            sendCommand(socket, data)
            .then(function() {
            })
            .catch(function() {
            })
        })
        */

    },
    help = function(socket) {
        var data = `Here are my commands :
play the video: Typing this command will start playing the video,
take a phto: Typing this command will take a photo for you,
status: Typing status will display the current state of Pi,
help: Typing help will display all available commands that Pi Bot can respond to.`
        sendCommand(socket, data)
    },
    sleep = function (sleepDuration ){
        var now = new Date().getTime();
        while(new Date().getTime() < now + sleepDuration){ /* do nothing */ }
    },
    motionListener = function(socket) {
        exec('netstat -na | grep 8081', function(err, stdout, stderr) {
            log('this :' + this)
            log(stderr)
            if( !stdout || stdout === '') { isMotionDetecting = false }
        })
    };

var cmds = [
    {c: askTakingPhotoCmds, a: askTakingPhoto},
    {c: takePhotoCmds, a: sendPhoto},
    {c: startPlayingCmds, a: startPlaying},
    {c: stopPlayingCmds, a: stopPlaying},
    {c: timeCmds, a: showTime},
    {c: helpCmds, a: help},
    {c: statusCmds, a: status},
    {c: startMotionCmd, a: startMotion},
    {c: stopMotionCmd, a: stopMotion}
]

module.exports = {
    get: function(str) {
        return new Promise(function(resolve, reject) {
            str = str.toLowerCase()
            cmds.forEach(function(cmd) {
                cmd.c.forEach(function(c) {
                    if(str.indexOf(c) > -1) { resolve({ 'text': c, 'action': cmd.a }) }
                })
            })
            reject()
        })
    }
}
