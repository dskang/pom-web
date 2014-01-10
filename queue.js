var queue = new Array();
var conversation = require('./conversation.js');

//FIXME: style this better

exports.addUser = function(user) {
  queue.push(user);
}

exports.getPartner = function(user) {
  return conversation.pickPartner(user, queue);
}

exports.removeUser = function(user) {
  var index = queue.indexOf(user);
  if (index !== -1) {
    queue.splice(index, 1);
  }
}

exports.containsUser = function(user) {
  for (var i = 0; i < queue.length; i++) {
    if (queue[i].id === user.id) return true;
  }
  return false;
}

exports.length = function() {
  return queue.length;
}
