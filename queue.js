  var queue = new Array();
  var conversation = require('./conversation.js');

  exports.addUser = function(user) {
    queue.push(user);
  }

  exports.getUser = function(currentUser) {
    return conversation.pickUser(currentUser, queue);
  }

  exports.removeUser = function(user) {
    var location = queue.indexOf(user);
    if (location !== -1) {
      queue.splice(location, 1);
    }
  }

  exports.length = function() {
   return queue.length;
 }