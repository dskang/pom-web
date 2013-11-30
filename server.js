var io = require('socket.io'),
express = require('express'),
princeton = require('./princeton'),
mongoose = require('mongoose'),
chatter = require('./chatter.js');

var port = process.env.PORT || 3000;
var app = express();

// Connect to Mongoose database
// mongoose.connect('mongodb://localhost/test');

app.get('/', function(req, res) {
  if (princeton.isValidIP(req.ip)) {
    res.sendfile(__dirname + '/public/index.html');
  } else {
    res.send('Sorry, this site is only for Princeton students!');
  }
});

app.use(express.static(__dirname + '/public'));

var chatRoom = io.listen(app.listen(port));

chatRoom.sockets.on('connection', function (socket) {
  if (princeton.isValidIP(socket.handshake.address.address)) {
    chatter.connectChatter(socket);
  }
});
