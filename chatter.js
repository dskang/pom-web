var convo = require('./conversation.js');
var queue = new Array();

// FIXME: make this larger than 0
var threshold = 0;

function User(socket, userID) {
  this.socket = socket;
  this.id = userID;
  this.partner = null;
  this.conversation = null;
  this.buttonClicked = false;
  this.messagesSent = 0;
  this.name = null;
  this.fbLink = null;

  var user = this;
  this.socket.on('disconnect', function() {
    if (!user.conversation) return;

    if (!user.conversation.endTime) {
      user.conversation.endTime = Date.now();
      convo.save(user.conversation);

      var userName = user.conversation.revealed ? user.name : 'Anonymous Tiger';
      user.partner.socket.emit('finished', {
        message: userName + ' has disconnected. Refresh the page to start another chat!'
      });
      user.partner.socket.disconnect();
    }
  });

  this.socket.on('chat message', function(data) {
    if (!user.conversation) return;

    user.messagesSent++;
    user.socket.emit('chat message', {
      name: 'You',
      message: data.message
    });

    var userName = user.conversation.revealed ? user.name : 'Anonymous Tiger';
    user.partner.socket.emit('chat message', {
      name: userName,
      message: data.message
    });
  });

  this.socket.on('dropdown displayed', function(data) {
    if (!user.conversation) return;

    user.conversation.buttonDisplayed = true;
  });

  this.socket.on('identity', function(data) {
    if (!user.conversation) return;

    user.name = data.name;
    user.fbLink = data.link;
    user.buttonClicked = true;

    if (user.partner.buttonClicked) {
      user.socket.emit('reveal', {
        name: user.partner.name,
        link: user.partner.fbLink
      });
      user.partner.socket.emit('reveal', {
        name: user.name,
        link: user.fbLink
      });
      user.conversation.revealed = true;
    }
  });

  this.socket.on('typing', function() {
    if (!user.conversation) return;

    user.partner.socket.emit('typing');
  });

  this.socket.on('not typing', function() {
    if (!user.conversation) return;

    user.partner.socket.emit('not typing');
  });
}

function Conversation(user1) {
    this.user1 = user1;
    this.user2 = null;
    this.startTime = Date.now();
    this.endTime = null;
    this.matchingHeuristic = null;
    this.buttonDisplayed = false;
    this.revealed = false;
}

exports.connectChatter = function(socket, userID) {

  var user = new User(socket, userID);

  socket.emit('entrance', {
    message: 'Welcome to Tigers Anonymous!'
  });

  if (queue.length <= threshold) {
    queue.push(user);
    user.socket.emit('waiting', {
      message: 'Waiting for another Princeton student to join...'
    });

    // FIXME: remove handler after user is taken off queue
    user.socket.on('disconnect', function() {
      queue.splice(queue.indexOf(user), 1);
    });

  } else {
    // Create conversation
    var conversation = new Conversation(user);
    user.conversation = conversation;

    // Match user with partner
    convo.pickPartner(user, queue, function(partner) {

    user.partner = partner;
    partner.partner = user;

    conversation.user2 = partner;
    partner.conversation = conversation;

    // Notify users that they are connected
    var connectedMessage = {
      message: "You're now chatting with another Princeton student. Say hi!"
    };
    user.socket.emit('matched', connectedMessage);
    partner.socket.emit('matched', connectedMessage);

  });
  }
};
