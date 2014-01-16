var mongoose = require('mongoose');
var Conversation = mongoose.model('Conversation');
var heuristics = require('./heuristics');
var mailer = require('./mailer');

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
      user.conversation.save();

      var userName = user.conversation.revealed ? user.name : 'Anonymous Tiger';
      user.partner.socket.emit('finished', {
        message: userName + ' has disconnected. Refresh the page to start another chat!'
      });
      user.partner.socket.disconnect();
    }
  });

  this.socket.on('chat message', function(data) {
    if (!user.conversation) return;

    var pseudonym = (user.conversation.user1 === user ? 'Origin' : 'Black') + ": ";
    var chatHead = (user.conversation.revealed ? user.name : pseudonym);
    var d = new Date();
    var timeStamp = "[" + (d.getMonth() + 1) + "/" + (d.getDate()) + "/" + 
      (d.getFullYear()).toString().substring(2, 4) + " " + (d.getHours()) + ":" +
      (d.getMinutes()) + ":" + d.getSeconds() + "] ";
    var messageLog = timeStamp + chatHead + data.message + "\n";
    user.conversation.chatLog += messageLog;

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

function ConversationWrapper() {
    this.user1 = null;
    this.user2 = null;
    this.startTime = Date.now();
    this.endTime = null;
    this.matchingHeuristic = null;
    this.buttonDisplayed = false;
    this.revealed = false;
    this.chatLog = "";

    var self = this;
    this.save = function() {
      new Conversation({
        userID1: self.user1.id,
        userID2: self.user2.id,
        matchingHeuristic: self.matchingHeuristic,
        startTime: self.startTime,
        endTime: self.endTime,
        buttonDisplayed: self.buttonDisplayed,
        user1Clicked: self.user1.buttonClicked,
        user2Clicked: self.user2.buttonClicked,
        user1MessagesSent: self.user1.messagesSent,
        user2MessagesSent: self.user2.messagesSent
      }).save();

      mailer.sendMail(this);
    };
}

// Given a current user and a queue of potential matches, implement
// the UCB1 algorithm with a pre-defined set of heuristics as the
// bandit-arms. See write-up for more details.
var pickPartner = function(user, queue, partnerCallback) {
  console.log("Pairing detected, picking partner now.");
  heuristics.pick(Conversation, user, queue, partnerCallback, function(chosenHeuristic) {
    user.conversation.matchingHeuristic = chosenHeuristic;
    heuristics.execute(Conversation, user, queue, partnerCallback, heuristics[chosenHeuristic]);
  });
};

// FIXME: make this larger than 0
var threshold = 0;
var queue = new Array();

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
    var conversation = new ConversationWrapper();
    conversation.user1 = user;
    user.conversation = conversation;

    // Match user with partner
    pickPartner(user, queue, function(partner) {
      console.log("Partner selected!");
      console.log("Current partner is " + partner.id + ".");
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
