var queue = new Array();
var conversation = require('./conversation.js');

//FIXME: style this better

exports.addUser = function(user) {
  queue.push(user);
}

exports.getPartner = function(currentUser) {
  return conversation.pickPartner(currentUser, queue);
}

exports.removeUser = function(user) {
  var location = queue.indexOf(user);
  if (location !== -1) {
    queue.splice(location, 1);
  }
}

exports.containsUser = function(user) {
  for (var i = 0; i < queue.length; i++) {    
    if (queue[i].ownID === user.ownID) return true;
  }
  return false;
}

exports.length = function() {
  return queue.length;
}

exports.indexAt = function(i) {
  return queue[i];
}
