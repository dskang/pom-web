var mongoose = require('mongoose')
, Schema = mongoose.Schema;

var conversationSchema = new Schema({
  userID1: String, 
  userID2: String, 
  matchingHeuristic: Number, 
  chatLength: Number, 
  startTime: Date, 
  clicked: Boolean
});

var Conversation = mongoose.model('Conversation', conversationSchema);

 // Check to see if the current conversation is already in the database. 
 // If it is, ignore it, otherwise create a new entry and add it to the 
 // database. 
 exports.save = function(user) {
   Conversation.find()
   .or([{userID1: user.ownID, userID2: user.partnerID, startTime: user.startTime},
    {userID1: user.partnerID, userID2: user.ownID, startTime: user.startTime}])
   .exec(function(err, convo) {
    if(err) console.log("Error reading from the database!");
    else { 
      if (convo.length == 0) {
        new Conversation({
          userID1: user.ownID, 
          userID2: user.partnerID, 
          matchingHeuristic: user.matchingHeuristic, 
          chatLength: Date.now() - user.startTime, 
          startTime: user.startTime, 
          clicked: user.clicked
        }).save();
      }
    }
  });

 }

// Debugging function to print all conversations in the database
exports.displayAll = function() {
  Conversation.find(function(err, convo) {
    if(err) console.log("Error printing the conversation!");
    else console.log(convo);
  })
}