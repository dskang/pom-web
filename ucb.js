var questions = require('./questions').list;

var largePositiveNumber = 1000000000;
var largeNegativeNumber = -1000000000;

/******************************************************************************
* Implement UCB1 function to pick opening question
******************************************************************************/

exports.getQuestion = function(collection, user1, user2, questionCallback) {
  // Returns true if the conversation includes either user1 or user2
  var users = {
    $or: [
      {$eq: ["$userID1", user1.id]}, 
      {$eq: ["$userID2", user1.id]}, 
      {$eq: ["$userID1", user2.id]}, 
      {$eq: ["$userID2", user2.id]}
    ]
  };

  // Aggregation query object
  var outputFormat = {
    _id: "$question",
    plays: {$sum: 1}, 
    wins: {$sum: {$cond: [{$and: ["$user1Clicked", "$user2Clicked"]}, 1, 0]}},
    timesShown: {$sum: {$cond: [users, 1, 0]}}
  };

  // Aggregate conversation data and call UCB callback
  collection.aggregate({$group: outputFormat}).exec(function(err, mongoData) {
    if (err) console.log(err);
    UCB1(mongoData, questionCallback);
  });
}

var UCB1 = function(mongoData, questionCallback) {
  var finalData = {};

  // If there's no data, return a random question
  if (mongoData.length === 0) {
    var randomIndex = Math.floor(Math.random() * questions.length);
    var randomQuestion = questions[randomIndex];
    questionCallback(randomQuestion);
    return;
  
  // Otherwise, get all the available data for the questions and run UCB
  } else {
    var mongoLookup = {};
    var totalPlays = 0;

    // For each entry in mongoData, sum the total number of plays and 
    // populate the mongoLookup table with the corresponding question
    for (var i = 0; i < mongoData.length; i++) {
      mongoLookup[mongoData[i]["_id"]] = {
        plays: mongoData[i]["plays"], 
        wins: mongoData[i]["wins"], 
        shown: (mongoData[i]["timesShown"] > 0 ? true : false)
      };
      totalPlays += mongoData[i]["plays"];
    }

    for (var i = 0; i < questions.length; i++) {
      var question = questions[i];

      // If there's no data for this question, then it hasn't been 
      // displayed yet, so assign it an arbitrarily large UCB value
      if (typeof(mongoLookup[question]) === "undefined") {
        finalData[question] = largePositiveNumber;

      // If the question has already been shown, skip it
      } else if (mongoLookup[question].shown) { 
        continue; 

      // If the question hasn't been shown and there's data for it, 
      // compute the UCB value
      } else {
        var probabilityEstimate = 
          mongoLookup[question].wins/mongoLookup[question].plays;
        var UCBoundEstimate = 
          Math.sqrt(2 * Math.log(totalPlays / mongoLookup[question].plays));
        finalData[question] = probabilityEstimate + UCBoundEstimate;
      }
    }

    // Find question with max UCB value
    var bestValue = largeNegativeNumber;
    var bestMatch = null;
    for (var question in finalData) {
      var currentValue = finalData[question];
      if (currentValue >= bestValue) {
        bestMatch = question;
        bestValue = currentValue;
      }
    }

    // Return best match question with UCB
    questionCallback(bestMatch);
  }
}