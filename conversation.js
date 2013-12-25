var mongoose = require('mongoose')
, Schema = mongoose.Schema;

var conversationSchema = new Schema({
  userID1: String, 
  userID2: String, 
  matchingHeuristic: String, 
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

exports.pickUser = function (user, queue) {

  // pick matching heuristic
    // use UCB algorithm to pick the correct heuristic
      // for each matching heuristic, 
      // calculate average success rate
  // end up with the chosenHeuristic
  var chosenHeuristic = "FIFO";

  // Implement chosenHeuristic matching algorithm
  var partner = queue.shift();
  
  // Update user and partner with the chosenHeuristic tag
  user.matchingHeuristic = chosenHeuristic;
  partner.matchingHeuristic = chosenHeuristic; 

  // Return the chosen partner
  return partner;

}

// Debugging function to print all conversations in the database
exports.displayAll = function() {
  Conversation.find(function(err, convo) {
    if(err) console.log("Error printing the conversation!");
    else console.log(convo);
  })
}