var io = require('socket.io'),
express = require('express'),
range_check = require('range_check'),
chatter = require('./chatter.js');

var port = process.env.PORT || 3000;
var app = express();

var princetonIPs = [
  "128.112.0.0/16",
  "140.180.0.0/16",
  "204.153.48.0/22",
  "66.180.176.0/24",
  "66.180.177.0/24",
  "66.180.180.0/22"
];

function isValidIP(userIP) {
  if (userIP == "127.0.0.1") {
    return true;
  }
  for (var i = 0; i < princetonIPs.length; i++) {
    if (range_check.in_range(userIP, princetonIPs[i])) {
      return true;
    }
  }
  return false;
}

app.get('/', function(req, res) {
  if (isValidIP(req.ip)) {
    res.sendfile(__dirname + '/public/index.html');
  } else {
    res.send('Sorry, this site is only for Princeton students!');
  }
});

app.use(express.static(__dirname + '/public'));

var chatRoom = io.listen(app.listen(port));

chatter.setSockets(chatRoom.sockets);

chatRoom.sockets.on('connection', function (socket) {
  if (isValidIP(socket.handshake.address.address)) {
    chatter.connectChatter(socket);
  }
});
