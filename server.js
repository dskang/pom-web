var io = require('socket.io'),
express = require('express'),
princeton = require('./princeton'),
chatter = require('./chatter.js');

var port = process.env.PORT || 3000;
var app = express();

app.get('/', function(req, res) {
  if (princeton.isValidIP(req.ip)) {
    res.sendfile(__dirname + '/public/index.html');
  } else {
    res.send('Sorry, this site is only for Princeton students!');
  }
});

app.use(express.static(__dirname + '/public'));

var chatRoom = io.listen(app.listen(port));

chatter.setSockets(chatRoom.sockets);

chatRoom.sockets.on('connection', function (socket) {
  if (princeton.isValidIP(socket.handshake.address.address)) {
    chatter.connectChatter(socket);
  }
});
