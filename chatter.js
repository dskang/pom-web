// FIXME: make this larger than 0
var threshold = 0;
var queue = require('./queue.js');
var userName = 'You';
var partnerName = 'Anonymous Tiger';
var conversation = require('./conversation.js');

// FIXME: make this false before pushing to production
var debug = true;

exports.connectChatter = function(currentSocket, userID) {

  var partner;
  var user = {
    socket: currentSocket,
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
  user.socket.emit('entrance', {
    message: 'Welcome to the chat room!'
  });

  // Check if the buffer is full.
  if (queue.length() <= threshold) {

    // If the user isn't already in the buffer, add the user.
    if (!queue.containsUser(user) || debug) {
      queue.addUser(user);
      user.socket.emit('waiting', {
        message: 'Waiting for partner to join.'
      });
      user.socket.on('disconnect', function() {
        queue.removeUser(user);
      });
    }

    // Otherwise, serve an denial message and prevent the user from
    // connecting.
    else {
      user.socket.emit('exit', {
        message: 'Sorry, you can only chat with one person at a time!'
      });
      user.socket.on('disconnect', function() {
        queue.removeUser(user);
      });
    }

    // If buffer is full, then match the current user with a user
    // from the buffer.
  } else {

    // Only match the current user if that user isn't already present
    // in the buffer (to prevent people from chatting with themselves).
    if (!queue.containsUser(user) || debug) {
      partner = queue.getPartner(user);

      // Populate the ID field of both users.
      partner.partnerID = user.ownID;
      user.partnerID = partner.ownID;

      // Populate startTime field of both users.
      partner.startTime = Date.now();
      user.startTime = Date.now();

      // Tell both users that they can start chatting.
      var connectedMessage = {
        message: 'Connected! Go ahead and start chatting.'
      };

      user.socket.emit('ready', connectedMessage);
      partner.socket.emit('ready', connectedMessage);

      var disconnectedMessage = {
        message: partnerName + ' has disconnected. Refresh the page to start another chat!'
      };

      // When either of the users disconnects from the chatroom, log
      // the conversation and let the other user know that a disconnect
      // has occurred.
      user.socket.on('disconnect', function() {
        partner.socket.emit('exit', disconnectedMessage);
        conversation.save(partner);

      });

      partner.socket.on('disconnect', function() {
        user.socket.emit('exit', disconnectedMessage);
        conversation.save(user);
      });

      // Whenever either user sends a message, update the log of messages
      // sent/received and display the message to both users.
      user.socket.on('chat', function(data) {

        user.messagesSent++;
        partner.messagesReceived++;

        user.socket.emit('chat', {
          message: userName + ': ' + data.message
        });
        partner.socket.emit('chat', {
          message: partnerName + ': ' + data.message
        });
      });

      partner.socket.on('chat', function(data) {

        partner.messagesSent++;
        user.messagesReceived++;

        user.socket.emit('chat', {
          message: partnerName + ': ' + data.message
        });
        partner.socket.emit('chat', {
          message: userName + ': ' + data.message
        });
      });

      // Whenever the "Reveal My Identity" button is revealed,
      // update the corresponding property of both users.
      user.socket.on('reveal-button', function(data) {
        user.buttonDisplayed = true;
        partner.buttonDisplayed = true;
      });

      partner.socket.on('reveal-button', function(data) {
        partner.buttonDisplayed = true;
        user.buttonDisplayed = true;
      })
    }

    // If the current user is already in the buffer, then serve a
    // denial message to them and prevent them from re-entering the
    // buffer.
    else {
      user.socket.emit('exit', {
        message: 'Sorry, you can only chat with one person at a time!'
      });
      user.socket.on('disconnect', function() {
        queue.removeUser(user);
      });
    }
  }
};
