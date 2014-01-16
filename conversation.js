var mongoose = require('mongoose')
, Schema = mongoose.Schema;
var heuristics = require('./heuristics.js');
var nodemailer = require('nodemailer');

// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "tigersanon@gmail.com",
        pass: "originblack"
    }
});

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

// Saves the conversation into MongoDB and send an email copy to
// tigersanon@gmail.com 
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

// setup chat log email
var conversationLog = {
    from: "TigersAnonymous <tigersanon@gmail.com>",
    to: "tigersanon@gmail.com",
    subject: "Conversation Log - " + (new Date(conversation.startTime)).toString(), // Subject line
    text: conversation.chatLog + 
    "\n--------------------------------------\n\n" + 
    "First User: " + user1.id + " (" + conversation.pseudonym1 + ")" + 
    "\nSecond User: " + user2.id + " (" + conversation.pseudonym2 + ")" +
    "\nMatching Heuristic: " + conversation.matchingHeuristic + 
    "\nStart Time: " + (new Date(conversation.startTime)).toString() + 
    "\nLength: " + ((conversation.endTime - conversation.startTime) / 60000).toFixed(2) + " minutes" + 
    "\nButton Displayed: " + (conversation.buttonDisplayed ? "Yes" : "No") +
    "\nUser 1 Clicked: " + (conversation.user1Clicked ? "Yes" : "No") + 
    "\nUser 2 Clicked: " + (conversation.user2Clicked ? "Yes" : "No") +
    "\nUser 1 Messages Sent: " + user1.messagesSent + 
    "\nUser 2 Messages Sent: " + user2.messagesSent 
}

// send conversation log to tigersanon@gmail.com
smtpTransport.sendMail(conversationLog, function(error, response) {
    if (error) {
        console.log(error);
    }
    else {
        console.log("Message sent: " + response.message);
    }
});

};

// Given a current user and a queue of potential matches, implement
// the UCB1 algorithm with a pre-defined set of heuristics as the 
// bandit-arms. See write-up for more details.
exports.pickPartner = function (user, queue, partnerCallback) {
  heuristics.pick(Conversation, user, queue, partnerCallback, function(chosenHeuristic) {
    user.conversation.matchingHeuristic = chosenHeuristic;
    heuristics.execute(Conversation, user, queue, partnerCallback, heuristics[chosenHeuristic]);
  });
};