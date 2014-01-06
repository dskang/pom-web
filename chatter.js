// FIXME: make this larger than 0
var threshold = 0;
var queue = require('./queue.js');
var myName = 'Me';
var theirName = 'Anonymous Tiger';
var conversation = require('./conversation.js');

// FIXME: make this false before pushing to production
var debug = true;

exports.connectChatter = function (currentSocket, userID) {

  var thatUser;
  var thisUser = {socket: currentSocket, 
    ownID: userID, 
    partnerID: null, 
    startTime: null, 
    matchingHeuristic: null, 
    buttonDisplayed: false,
    ownClick: false, 
    partnerClick: false,
    messagesSent: 0, 
    messagesReceived: 0
  };

  // Send welcome message to connected user.
  thisUser.socket.emit('entrance', {
    message: 'Welcome to the chat room!'
  });

// Check if the buffer is full.
if (queue.length() <= threshold) {

  // If the user isn't already in the buffer, add the user.
  if (!queue.containsUser(thisUser) || debug) {
    queue.addUser(thisUser);
    thisUser.socket.emit('waiting', {
      message: 'Waiting for partner to join.'
    });
    thisUser.socket.on('disconnect', function() {
      queue.removeUser(thisUser);
    });
  }

  // Otherwise, serve an denial message and prevent the user from 
  // connecting.
  else {
    thisUser.socket.emit('exit', {
      message: 'Sorry, you can only chat with one person at a time!'
    });
    thisUser.socket.on('disconnect', function() {
      queue.removeUser(thisUser);
    });
  }

  // If buffer is full, then match the current user with a user 
  // from the buffer.
} else {

  // Only match the current user if that user isn't already present
  // in the buffer (to prevent people from chatting with themselves).
  if (!queue.containsUser(thisUser) || debug) {    
    thatUser = queue.getPartner(thisUser);

    // Populate the ID field of both users.
    thatUser.partnerID = thisUser.ownID;
    thisUser.partnerID = thatUser.ownID;

    // Populate startTime field of both users.
    thatUser.startTime = Date.now();
    thisUser.startTime = Date.now();

  // Tell both users that they can start chatting.
  var connectedMessage = {
    message: 'Connected! Go ahead and start chatting.'
  };

  thisUser.socket.emit('ready', connectedMessage);
  thatUser.socket.emit('ready', connectedMessage);

  var disconnectedMessage = {
    message: theirName + ' has disconnected. Refresh the page to start another chat!'
  };

  // When either of the users disconnects from the chatroom, log 
  // the conversation and let the other user know that a disconnect
  // has occurred.
  thisUser.socket.on('disconnect', function() {
    thatUser.socket.emit('exit', disconnectedMessage);
    conversation.save(thatUser);

  });

  thatUser.socket.on('disconnect', function() {
    thisUser.socket.emit('exit', disconnectedMessage);
    conversation.save(thisUser);
  });

  // Whenever either user sends a message, update the log of messages
  // sent/received and display the message to both users.
  thisUser.socket.on('chat', function(data) {

    thisUser.messagesSent++;
    thatUser.messagesReceived++;

    thisUser.socket.emit('chat', {
      message: myName + ': ' + data.message
    });
    thatUser.socket.emit('chat', {
      message: theirName + ': ' + data.message
    });
  });

  thatUser.socket.on('chat', function(data) {

    thatUser.messagesSent++;
    thisUser.messagesReceived++;

    thisUser.socket.emit('chat', {
      message: theirName + ': ' + data.message
    });
    thatUser.socket.emit('chat', {
      message: myName + ': ' + data.message
    });
  });

  // Whenever the "Reveal My Identity" button is revealed, 
  // update the corresponding property of both users.
  thisUser.socket.on('reveal-button', function(data) {
    thisUser.buttonDisplayed = true;
    thatUser.buttonDisplayed = true;
  });

  thatUser.socket.on('reveal-button', function(data) {
    thatUser.buttonDisplayed = true;
    thisUser.buttonDisplayed = true;
  })
}

// If the current user is already in the buffer, then serve a 
// denial message to them and prevent them from re-entering the
// buffer.
else {
  thisUser.socket.emit('exit', {
    message: 'Sorry, you can only chat with one person at a time!'
  });
  thisUser.socket.on('disconnect', function() {
    queue.removeUser(thisUser);
  });
}
}
};
