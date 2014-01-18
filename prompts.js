exports.getWelcomeMessage = function() {
  return 'Welcome to Tigers Anonymous!';
};

exports.getWaitingMessage = function() {
  return 'Waiting for another Princeton student to join...';
};

exports.getConnectedMessage = function() {
  return "You're now chatting with another Princeton student. Say hi!";
};

exports.getQuestionMessage = function(question) {
  return "If you're feeling spontaneous, you can start by answering a question: " + question;
};

exports.getDisconnectedMessage = function(user) {
  var userName = user.conversation.revealed ? user.name : 'Anonymous Tiger';
  return userName + ' has disconnected. Refresh the page to start another chat!';
};