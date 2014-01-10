var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    princeton = require('./princeton'),
    mongoose = require('mongoose'),
    chatter = require('./chatter.js'),
    crypto = require('crypto'),
    wait = require('wait.for');

var port = process.env.PORT || 3000;
server.listen(port);

app.use(express.cookieParser());

// FIXME: Connect to Mongoose database
mongoose.connect('mongodb://localhost/test');

app.get('/chat', function(req, res) {
  if (princeton.isValidIP(req.ip)) {
    if (!req.cookies.chatterID) {
      crypto.pseudoRandomBytes(16, function(err, buff) {
       res.cookie('chatterID', buff.toString('hex'), {
         maxAge: 60*60*24*356*1000
       });
     });
    }

    res.sendfile(__dirname + '/public/chat.html');
  } else {
    // FIXME : serve a denial page to non-Princeton users
    res.send('Sorry, this site is only for Princeton students!');
  }
});

app.use(express.static(__dirname + '/public'));

io.configure(function() {
  io.set('authorization', function(handshakeData, callback) {
    var isValid = princeton.isValidIP(handshakeData.address.address);
    callback(null, isValid);
  });
});

function getValueFromCookie(name, cookie) {
  var pairs = cookie.split('; ');
  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    if (pair[0] === name) {
      return pair[1];
    }
  }
}

io.sockets.on('connection', function (socket) {
  var userID = getValueFromCookie('chatterID', socket.handshake.headers.cookie);
  if (userID) {
    wait.launchFiber(chatter.connectChatter, socket, userID);
  }
});
