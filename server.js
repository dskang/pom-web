var io = require('socket.io'),
express = require('express'),
chatter = require('./chatter.js');

var port = process.env.PORT || 3000;
var app = express();

// FIXME change this to actual princeton IP addresses
var regExpArray = new Array(/127.0.0.1/);

app.get('/', function(req, res) {

for (var i = 0; i < regExpArray.length; i++) {
  if(regExpArray[i].test(req.ip)) {
    res.sendfile(__dirname + '/public/index.html');
  }
  else {
    res.send('Sorry, this site is only for Princeton students!');
  }
}

});

app.use(express.static(__dirname + '/public'));

var chatRoom = io.listen(app.listen(port));

chatter.setSockets(chatRoom.sockets);

chatRoom.sockets.on('connection', function (socket) {
  console.log(socket.handshake.address);
  chatter.connectChatter(socket);
});

/*
128.112.0.0/16
140.180.0.0/16   (note 2)
204.153.48.0/22
66.180.176.0/24   (note 1)
66.180.177.0/24
66.180.180.0/22   (note 1)
*/
