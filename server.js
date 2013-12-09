var io = require('socket.io'),
express = require('express'),
princeton = require('./princeton'),
mongoose = require('mongoose'),
chatter = require('./chatter.js'),
crypto = require('crypto');

var port = process.env.PORT || 3000;
var app = express();
app.use(express.cookieParser());

var userID = null;

// Connect to Mongoose database
mongoose.connect('mongodb://localhost/test');

app.get('/', function(req, res) {

  // Check IP address to remove non-Princeton users
  if (princeton.isValidIP(req.ip)) {

    // If it's a returning user, read their userID
    if ((typeof req.cookies.chatterID) !== 'undefined') 
    {
      userID = req.cookies.chatterID;
    }

    // Otherwise, they're a new user, so assign them a random ID
    else {
      crypto.pseudoRandomBytes(16, function(err, buff) {
       res.cookie('chatterID', buff.toString('hex'), {maxAge: 60*60*24*356*1000});
       userID = req.cookies.chatterID;
     });
    }

    // Send the main chatroom page
    res.sendfile(__dirname + '/public/index.html');
  }
  else {
    // FIXME : serve a denial page to non-Princeton users
    res.send('Sorry, this site is only for Princeton students!');
  }
});

app.use(express.static(__dirname + '/public'));
var chatRoom = io.listen(app.listen(port));

// If the user is from Princeton, connect their socket to the chatroom
chatRoom.sockets.on('connection', function (socket) {
  if (princeton.isValidIP(socket.handshake.address.address)) {
    chatter.connectChatter(socket, userID);
  }
});