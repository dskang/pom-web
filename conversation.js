var mongoose = require('mongoose')
, Schema = mongoose.Schema;
var wait = require('wait.for');

var heuristicList = ["FIFO", "LIFO", "Random", "ChatLengthHiLo", 
"ChatLengthHiHi", "LastVisitHiLo", "LastVisitHiHi", "ClickProbHiLo", 
"ClickProbHiHi", "MatchProbHiLo", "MatchProbHiHi", "MessagesSentHiLo", 
"MessagesSentHiHi", "MessagesReceivedHiLo", "MessagesReceivedHiHi", 
"MessageDiscrepancyHiLo", "MessageDiscrepancyHiHi"];

/******************************************************************************
* Initialize mongoDB database schema and model
******************************************************************************/

// Build new schema for database entry
var conversationSchema = new Schema({
  userID1: String,
  userID2: String,
  startTime: Date,
  endTime: Date,
  matchingHeuristic: String,
  buttonDisplayed: Boolean,
  user1Clicked: Boolean,
  user2Clicked: Boolean,
  user1MessagesSent: Number,
  user2MessagesSent: Number
});

// Compile schema into mongoDB model object, which can be used to manipulate 
// the set of Conversation documents below.
var Conversation = mongoose.model('Conversation', conversationSchema);

/******************************************************************************
* Implement public functions, visible to all clients using the conversation.js
* module.
******************************************************************************/

exports.save = function(conversation) {
  var user1 = conversation.user1;
  var user2 = conversation.user2;
  new Conversation({
    userID1: user1.id,
    userID2: user2.id,
    matchingHeuristic: conversation.matchingHeuristic,
    startTime: conversation.startTime,
    endTime: conversation.endTime,
    buttonDisplayed: conversation.buttonDisplayed,
    user1Clicked: user1.buttonClicked,
    user2Clicked: user2.buttonClicked,
    user1MessagesSent: user1.messagesSent,
    user2MessagesSent: user2.messagesSent
  }).save();
};

 // Given a current user and a queue of potential matches, implement
 // the UCB1 algorithm with a pre-defined set of heuristics as the 
 // bandit-arms. See write-up for more details.
 exports.pickPartner = function (user, queue) {

  // pick matching heuristic
  var currentValue = null;
  var currentMax = 0;
  var currentBestHeuristic = null;

  // for each matching heuristic, calculate UCB value and
  // find the maximum value and choose it as the heuristic
  for (var i = 0; i < heuristicList.length; i++) {
    var currentValue = findHeuristicAndExecute(heuristicList[i], UCB1);
    if (currentValue > currentMax) {
      currentBestHeuristic = heuristicList[i];
      currentMax = currentValue;
    }
  }

  // end up with the chosenHeuristic
  var chosenHeuristic = currentBestHeuristic;
  var partner = null;

  // implement the matching heuristic chosen 
  switch(chosenHeuristic)
  {
    case "FIFO": 
    partner = FIFO(user, queue);
    break;
    case "LIFO":
    partner = LIFO(user, queue);
    break;
    case "Random":
    partner = Random(user, queue);
    break;
    case "ChatLengthHiLo": 
    partner = findPartnerWithMaxDistance(user, queue, averageChatLength);
    break;
    case "ChatLengthHiHi": 
    partner = findPartnerWithMinDistance(user, queue, averageChatLength);
    break;
    case "LastVisitHiLo":
    partner = findPartnerWithMaxDistance(user, queue, averageLastVisit);
    break;
    case "LastVisitHiHi":
    partner = findPartnerWithMinDistance(user, queue, averageLastVisit);
    break;
    case "ClickProbHiLo":
    partner = findPartnerWithMaxDistance(user, queue, averageClickProb);
    break;
    case "ClickProbHiHi":
    partner = findPartnerWithMinDistance(user, queue, averageClickProb);
    break;
    case "MatchProbHiLo":
    partner = findPartnerWithMaxDistance(user, queue, averageMatchProb);
    break;
    case "MatchProbHiHi":
    partner = findPartnerWithMinDistance(user, queue, averageMatchProb);
    break;
    case "MessagesSentHiLo":
    partner = findPartnerWithMaxDistance(user, queue, averageMessagesSent);
    break;
    case "MessagesSentHiHi":
    partner = findPartnerWithMinDistance(user, queue, averageMessagesSent);
    break;
    case "MessagesReceivedHiLo":
    partner = findPartnerWithMaxDistance(user, queue, averageMessagesReceived);
    break;
    case "MessagesReceivedHiHi":
    partner = findPartnerWithMinDistance(user, queue, averageMessagesReceived);
    break;
    case "MessageDiscrepancyHiLo":
    partner = findPartnerWithMaxDistance(user, queue, averageMessageDiscrepancy);
    break;
    case "MessageDiscrepancyHiHi":
    partner = findPartnerWithMinDistance(user, queue, averageMessageDiscrepancy);
    break;
  }

  // Update field of both user and partner with the matching heuristic
  user.matchingHeuristic = chosenHeuristic;
  partner.matchingHeuristic = chosenHeuristic;
  return partner;

}

/******************************************************************************
* Implement matching heuristic helper functions
******************************************************************************/

// This function returns the first element of the queue 
// (i.e. First In First Out, or the least recently added)
var FIFO = function(user, queue) {
  return queue.shift();
}

// This function returns the last element of the queue
// (i.e. Last In First Out, or the most recently added)
var LIFO = function(user, queue) {
  return queue.pop();
}

// This function returns a random element of the queue
var Random = function(user, queue) {
  var randomIndex = Math.floor(Math.random()*queue.length);
  var randomUser = queue[randomIndex];
  queue.splice(randomIndex, 1); // remove randomUser from queue
  return randomUser;
}

// This function finds the potential partner in queue that 
// has the minimum distance to user with respect to the normFunction, 
// where normFunction takes two arguments: the current user and 
// an array of conversation objects representing the current user's 
// conversation history.
var findPartnerWithMinDistance = function(user, queue, normFunction) {

  // compute average chat length for current user
  var userAverage = findUserAndExecute(user, normFunction);

  // initialize running min variables
  var bestDistance = Number.POSITIVE_INFINITY;
  var bestMatch = null;

  // find the max distance with respect to the normFunction
  for (var i = 0; i < queue.length; i++) {
    var currentAvg = findUserAndExecute(queue[i], normFunction);
    var currentDist = Math.abs(currentAvg - userAverage);
    if (currentDist <= bestDistance) {
      bestMatch = queue[i];
      bestDistance = currentDist;
    }
  }

  return bestMatch;
}

// This function finds the potential partner in queue that 
// has the maximum distance to user with respect to the normFunction, 
// where normFunction takes two arguments: the current user and 
// an array of conversation objects representing the current user's 
// conversation history.
var findPartnerWithMaxDistance = function(user, queue, normFunction) {

  // compute average chat length for current user
  var userAverage = findUserAndExecute(user, normFunction);

  // initialize running max variables
  var bestDistance = Number.NEGATIVE_INFINITY;
  var bestMatch = null;

  // find the max distance with respect to the normFunction
  for (var i = 0; i < queue.length; i++) {
    var currentAvg = findUserAndExecute(queue[i], normFunction);
    var currentDist = Math.abs(currentAvg - userAverage);
    if (currentDist >= bestDistance) {
      bestMatch = queue[i];
      bestDistance = currentDist;
    }
  }

  return bestMatch;
}

// This helper function executes functionToApply on the array 
// of conversation representing the total history of the user 
// and returns the result. Note that functionToApply takes in
// both the current user object as well as the conversation 
// history array.
var findUserAndExecute = function(user, functionToApply) {
 var query = {$or: [{userID1: user.id}, {userID2: user.id}]};
 var data = wait.forMethod(Conversation, "find", query);
 return functionToApply(user, data);
}

// This helper function executes functionToApply on the array 
// of conversation representing the total history of the heuristic 
// and returns the result.
var findHeuristicAndExecute = function(heuristic, functionToApply) {
  var query = {matchingHeuristic: heuristic};
  var data = wait.forMethod(Conversation, "find", query);
  return functionToApply(data);
}

/******************************************************************************
* Implement norm functions
******************************************************************************/

// FIXME: Norm function brief descriptions
var averageChatLength = function(user, convoArray) {

  var sum = 0.0;
  var length = convoArray.length;
  for (var i = 0; i < length; i++) {
    var conv = convoArray[i];
    var chatLength = conv.endTime - conv.startTime;
    sum += chatLength;
  }
  if (length > 0) return sum/length;
  else return 0;
}

var averageLastVisit = function(user, convoArray) {

  var sum = 0.0;
  var length = convoArray.length;
  for (var i = 0; i < length; i++) {
    sum = sum + Date.parse(convoArray[i].startTime);
  }
  if (length > 0) return Date.now() - (sum/length);
  else return Math.POSITIVE_INFINITY;

}

var averageMatchProb = function(user, convoArray) {

  var sum = 0.0;
  var length = convoArray.length;
  for (var i = 0; i < length; i++) {
    if (convoArray[i].user1Clicked && convoArray[i].user2Clicked) sum++;
  }
  if (length > 0) return sum/length;
  else return 0;

}

var averageClickProb = function(user, convoArray) {

  var sum = 0.0;
  var length = convoArray.length;
  for (var i = 0; i < length; i++) {
    if (user.id === convoArray[i].userID1 && convoArray[i].user1Clicked) sum++;
    else if (user.id === convoArray[i].userID2 && convoArray[i].user2Clicked) sum++;
  }
  if (length > 0) return sum/length;
  else return 0;

}

var averageMessagesSent = function(user, convoArray) {
  
  var sum = 0.0;
  var length = convoArray.length;
  for (var i = 0; i < length; i++) {
    if (user.id === convoArray[i].userID1) sum = sum + convoArray[i].user1MessagesSent;
    else if (user.id === convoArray[i].userID2) sum = sum + convoArray[i].user2MessagesSent;
  }
  if (length > 0) return sum/length;
  else return 0;
}

var averageMessagesReceived = function(user, convoArray) {

  var sum = 0.0;
  var length = convoArray.length;
  for (var i = 0; i < length; i++) {
    if (user.id === convoArray[i].userID1) sum = sum + convoArray[i].user2MessagesSent;
    else if (user.id === convoArray[i].userID2) sum = sum + convoArray[i].user1MessagesSent;
  }
  if (length > 0) return sum/length;
  else return 0;
}

var averageMessagesSent = function(user, convoArray) {
  
  var sum = 0.0;
  var length = convoArray.length;
  for (var i = 0; i < length; i++) {
    if (user.id === convoArray[i].userID1) sum = sum + convoArray[i].user1MessagesSent;
    else if (user.id === convoArray[i].userID2) sum = sum + convoArray[i].user2MessagesSent;
  }
  if (length > 0) return sum/length;
  else return 0;
}

var averageMessagesReceived = function(user, convoArray) {

  var sum = 0.0;
  var length = convoArray.length;
  for (var i = 0; i < length; i++) {
    if (user.id === convoArray[i].userID1) sum = sum + convoArray[i].user2MessagesSent;
    else if (user.id === convoArray[i].userID2) sum = sum + convoArray[i].user1MessagesSent;
  }
  if (length > 0) return sum/length;
  else return 0;
}

var averageMessageDiscrepancy = function(user, convoArray) {

  var sum = 0.0;
  var length = convoArray.length;
  for (var i = 0; i < length; i++) {
    if (user.ownID === convoArray[i].userID1) 
      sum = sum + (convoArray[i].user1MessagesSent - convoArray[i].user2MessagesSent);
    else if (user.ownID === convoArray[i].userID2) 
      sum = sum + (convoArray[i].user2MessagesSent - convoArray[i].user1MessagesSent);
  }
  if (length > 0) return sum/length;
  else return 0;
}

/******************************************************************************
* Implement UCB1 function
******************************************************************************/

// FIXME: explain this function
var UCB1 = function(convoArray) {

  var thisHeuristicsSuccesses = 0.0;

  // total number of times this heuristic has been used
  var thisHeuristicsPlays = convoArray.length;

  // total number of times this heuristic has resulted in a successful match
  for (var i = 0; i < thisHeuristicsPlays; i++) {
    if (convoArray[i].user1Clicked && convoArray[i].user2Clicked) thisHeuristicsSuccesses++;
  }

  var allConversations = wait.forMethod(Conversation, "find");
  var allPlays = allConversations.length;

  var probabilityEstimate = thisHeuristicsSuccesses/thisHeuristicsPlays;
  var UCBoundEstimate = Math.sqrt(2*Math.log(allPlays)/thisHeuristicsPlays);
  if (thisHeuristicsPlays > 0) return (probabilityEstimate + UCBoundEstimate);
  // by making the first return value POSITIVE_INFINITY, we ensure that each arm is played once first
  else return Number.POSITIVE_INFINITY;

}

/******************************************************************************
* Debugging functions
******************************************************************************/

// This function prints all the conversations in the database.
exports.displayAll = function() {
  Conversation.find(function(err, convo) {
    if (err) {
      console.log("Error printing the conversation!");
    } else {
      console.log(convo);
    }
  })
}
