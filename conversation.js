var mongoose = require('mongoose')
, Schema = mongoose.Schema;
var heuristics = require('./heuristics.js');

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

  console.log("---------------CURRENT DATABASE----------------");
  Conversation.find(function(err, data) {
    console.log(data);
  })
};

 // Given a current user and a queue of potential matches, implement
 // the UCB1 algorithm with a pre-defined set of heuristics as the 
 // bandit-arms. See write-up for more details.
 exports.pickPartner = function (user, queue, partnerCallback) {
  heuristics.pick(Conversation, user, queue, partnerCallback, function(chosenHeuristic) {
    console.log("****************************************");
    console.log("CHOSEN HEURISTIC IS " + chosenHeuristic);
    console.log("****************************************");
    user.conversation.matchingHeuristic = chosenHeuristic;
    heuristics.execute(Conversation, user, queue, partnerCallback, heuristics[chosenHeuristic]);
  });
};