var io = require('socket.io'),
    connect = require('connect'),
    chatter = require('./chatter.js');

var port = process.env.PORT || 3000;

var app = connect().use(connect.static('public')).listen(port);
var chatRoom = io.listen(app);

chatter.setSockets(chatRoom.sockets);

chatRoom.sockets.on('connection', function (socket) {
  chatter.connectChatter(socket);
});
