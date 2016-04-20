var _ = require('lodash'),
    commands = require('./commands'),
    config = require('./config'),
    Socket = config.socket,
    Pi = config.pi,
    socket = require('socket.io-client')( Socket.uri, {'multiplex': false}),
    chat = config.chat,
    log = require('debug')(config.debug.tag + ':app');

    socket.emit('authenticate', {'authToken': Pi.authToken}, function(data) {
        if(data.code !== 200) {
            log('authentication error')
        }

        socket.on('message', function(message) {
            if(chat.id === message.chat.id && Pi.serial !== message.senderUser.serial) { // only handle message in chat
                var msg = message.data
                var cmd = commands.get(msg)
                log('command is: ' + cmd.text)
                if(cmd) { cmd.action(socket) }
            }
        })
    })
