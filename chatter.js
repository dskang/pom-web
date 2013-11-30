var allSockets = null;
var threshold = 0;
var queue = new Queue();
var myName = 'Me';
var theirName = 'Anonymous Tiger';

exports.setSockets = function  (sockets) {
  allSockets = sockets;
};

exports.connectChatter = function  (currentSocket) {

  var partner;
  var currentSocketWrapper = {socket: currentSocket, userdata: null};

  currentSocket.emit('entrance', {message: 'Welcome to the chat room!'});
  if (queue.length() <= threshold) {
    queue.addItem(currentSocketWrapper);
    currentSocket.emit('waiting', {message: 'Waiting for partner to join.'});
    currentSocket.on('disconnect', function() {
     queue.removeItem(currentSocketWrapper);
   });
  }

  else {
    partner =  queue.getItem(currentSocketWrapper, 0);
    currentSocket.emit('ready', {message: 'Connected! Go ahead and start chatting.'});
    partner.socket.emit('ready', {message: 'Connected! Go ahead and start chatting.'});

    currentSocket.on('disconnect', function() {
     partner.socket.emit('exit', {message: theirName + ' has disconnected. Refresh the page to start another chat!'});
   });
    partner.socket.on('disconnect', function() {
     currentSocket.emit('exit', {message: theirName + ' has disconnected. Refresh the page to start another chat!'});
   });

    currentSocket.on('chat', function(data) {
     currentSocket.emit('chat', {message: myName + ': ' + data.message});
     partner.socket.emit('chat', {message: theirName + ': ' + data.message});
   });
    partner.socket.on('chat', function(data) {
     currentSocket.emit('chat', {message: theirName + ': ' + data.message});
     partner.socket.emit('chat', {message: myName + ': ' + data.message});
   });

  }
};

exports.failure = function  (socket) {
  socket.emit('error', {message: 'Please log in to the chatroom.'});
};

function Queue ()
{
  this.array = new Array();
  this.addItem = function(item) {
    this.array.push(item);
  }
  this.getItem = function(currentSocket, matchingAlgorithm) {
    return this.array.shift();
  }
  this.removeItem = function(item) {
    var location = this.array.indexOf(item);
    if (location !== -1) {
      this.array.splice(location, 1);
    }
  }
  this.length = function() {
   return this.array.length;
  }
};

/* TEST CODE FOR QUEUE
var testQueue = new Queue();
testQueue.addItem('a');
testQueue.addItem('b');
testQueue.addItem('c');
testQueue.addItem('d');
testQueue.addItem('e');
testQueue.removeItem('d');
console.log(testQueue.array);
console.log('-------------');
console.log(testQueue.length());
console.log(testQueue.getItem());
console.log(testQueue.length());
console.log(testQueue.getItem());
console.log(testQueue.length());
console.log(testQueue.getItem());
console.log(testQueue.length());
console.log(testQueue.getItem());
/**/