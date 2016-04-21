var _ = require('lodash'),
    moment = require('moment'),
    commands = require('./commands'),
    config = require('./config'),
    Socket = config.socket,
    Pi = config.pi,
    socket = require('socket.io-client')( Socket.uri, {'multiplex': false}),
    chat = config.chat,
    log = require('debug')(config.debug.tag + ':app');

    socket.emit('authenticate', {'authToken': Pi.authToken}, function(data) {
        if(data.code !== 200) { log('authentication error') }
        socket.on('message', function(message) {
            if(chat.id === message.chat.id && Pi.serial !== message.senderUser.serial) { // only handle message in chat
                var msg = message.data
                var cmd = commands.get(msg)
                if(cmd) { log('command is: ' + cmd.text); cmd.action(socket) }
            }
        })

        // webcome
        var data = 'Good moring, Momo! My name is Pi Bot! So glad to see you!'
        socket.emit('messages/create', {
            'chatId': chat.id,
            'data': data,
            'mime': 'text/plain',
            'encoding': 'utf8',
            'meta': { 'type': 'stream' }
        }, function(data) {
            if(data.code !== 200) log(Errors.SEND_FAILED)
            log('sent successfully')
        })
    })
