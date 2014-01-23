var questions = require('./questions').list;

var largePositiveNumber = 1000000000;
var largeNegativeNumber = -1000000000;

/******************************************************************************
* Implement UCB1 function to pick opening question
******************************************************************************/

exports.getQuestion = function(collection, user1, user2, questionCallback) {
  var query = {$or: [{userID1: user1.id}, {userID2: user1.id}, {userID1: user2.id}, {userID2: user2.id}]};
  collection.distinct('question', query, function(err, previouslyUsedConversations) {
      var mapReduceQuery = {};
      mapReduceQuery.map = function() {
        if (this.user1Clicked && this.user2Clicked) {
          emit(this.question, {plays:1, wins:1});
          emit("AllQuestions", {plays: 1, wins: 1});
        } else {
          emit(this.question, {plays:1, wins:0});
          emit("AllQuestions", {plays: 1, wins: 0});
        }
      };

      mapReduceQuery.reduce = function(k, v) {
        var sum = 0.0;
        var output = {plays: 0, wins: 0};

        for (var i = 0; i < v.length; i++) {
          output.plays += v[i].plays;
          output.wins += v[i].wins;
        }
        return output;
      };

      if (previouslyUsedConversations === null) {
        collection.mapReduce(mapReduceQuery, function(err, mongoData) {
          UCB1(mongoData, [], questionCallback)
        });
      } else {
        var orQuery = [];
        for (var i = 0; i < previouslyUsedConversations.length; i++) {
          orQuery.push({question: previouslyUsedConversations[i]});
        }
        mapReduceQuery.query = {$not: {$or: orQuery}};
        collection.mapReduce(mapReduceQuery, function(err, mongoData) {
          UCB1(mongoData, previouslyUsedConversations, questionCallback);
        });
      }
    });
};

var UCB1 = function(mongoData, conversationList, questionCallback) {
  var finalData = {};

  // if there are no unexplored conversations left, or no data
  // on the remaining conversations, then pick a random one from the
  // large list
  if (typeof(mongoData) === "undefined") {
    var randomIndex = Math.floor(Math.random() * questions.length);
    var randomQuestion = questions[randomIndex];
    questionCallback(randomQuestion);
    return;
  } else {
    // otherwise, get all the available data for the questions and
    // run UCB on them
    var mongoLookup = {};
    for (var i = 0; i < mongoData.length; i++) {
      mongoLookup[mongoData[i]["_id"]] = mongoData[i]["value"];
    }
    for (var i = 0; i < questions.length; i++) {
      var question = questions[i];
      if (conversationList.indexOf(question) !== -1) break;
      if (typeof(mongoLookup[question]) === "undefined") {
        finalData[question] = largePositiveNumber;
      } else {
        // calculate UCB value for question
        var probabilityEstimate = 
          mongoLookup[question].wins/mongoLookup[question].plays;
        var UCBoundEstimate =
          Math.sqrt(2 * Math.log(mongoLookup["AllQuestions"].plays) / mongoLookup[question].plays);
        finalData[question] = probabilityEstimate + UCBoundEstimate;
      }
    }
  }

  // initialize running max variables
  var bestValue = largeNegativeNumber;
  var bestMatch = null;

  for (var i = 0; i < conversationList.length; i++) {
    var currentValue = finalData[conversationList[i]];
    if (currentValue >= bestValue) {
      bestMatch = conversationList[i];
      bestValue = currentValue;
    }
  }

  // return best match question with UCB
  questionCallback(bestMatch);
};
