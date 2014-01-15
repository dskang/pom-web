var mongoose = require('mongoose')
, Schema = mongoose.Schema;

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
* Implement matching heuristic helper functions
******************************************************************************/

exports = {

heuristics: ["FIFO", "LIFO", "Random", "ChatLengthHiLo", 
"ChatLengthHiHi", "LastVisitHiLo", "LastVisitHiHi", "ClickProbHiLo", 
"ClickProbHiHi", "MatchProbHiLo", "MatchProbHiHi", "MessagesSentHiLo", 
"MessagesSentHiHi", "MessagesReceivedHiLo", "MessagesReceivedHiHi", 
"MessageDiscrepancyHiLo", "MessageDiscrepancyHiHi"], 

// This function returns the first element of the queue 
// (i.e. First In First Out, or the least recently added)
FIFO: function(user, queue, partnerCallback) {
  partnerCallback(queue.shift());
},

// This function returns the last element of the queue
// (i.e. Last In First Out, or the most recently added)
LIFO: function(user, queue, partnerCallback) {
  partnerCallback(queue.pop());
},

// This function returns a random element of the queue
Random: function(user, queue, partnerCallback) {
  var randomIndex = Math.floor(Math.random()*queue.length);
  var randomUser = queue[randomIndex];
  queue.splice(randomIndex, 1); // remove randomUser from queue
  partnerCallback(randomUser);
},

MessagesSentHiLo: function(user, queue, partnerCallback) {
  MessagesSent(user, queue, findMaxDistance, partnerCallback);
},

MessagesSentHiHi: function(user, queue, partnerCallback) {
  MessagesSent(user, queue, findMinDistance, partnerCallback);
},

MessagesSent: function(user, queue, findFunction, partnerCallback) {
  var mapMessagesSent = function() {
    emit (this.userID1, this.user1MessagesSent); 
    emit (this.userID2, this.user2MessagesSent);
  };
  var query = generateMapReduceQuery(user, queue, mapMessagesSent);
  Conversation.mapReduce(query, function(err, mongoData) {
    findFunction(user, queue, mongoData, partnerCallback)
  });
}, 

MessagesReceivedHiLo: function(user, queue, partnerCallback) {
  MessagesReceived(user, queue, findMaxDistance, partnerCallback);
},

MessagesReceivedHiHi: function(user, queue, partnerCallback) {
  MessagesReceived(user, queue, findMinDistance, partnerCallback);
},

MessagesReceived: function(user, queue, findFunction, partnerCallback) {
  var mapMessagesReceived = function() {
    emit (this.userID1, this.user2MessagesSent);
    emit (this.userID2, this.user1MessagesSent);
  };
  var query = generateMapReduceQuery(user, queue, mapMessagesReceived);
  Conversation.mapReduce(query, function(err, mongoData) {
    findFunction(user, queue, mongoData, partnerCallback)
  });
},

ClickProbHiLo: function(user, queue, partnerCallback) {
  ClickProb(user, queue, findMaxDistance, partnerCallback);
},

ClickProbHiHi: function(user, queue, partnerCallback) {
  ClickProb(user, queue, findMinDistance, partnerCallback);
},

ClickProb: function(user, queue, findFunction, partnerCallback) {
  var mapClickProb = function() {
    if  (this.user1Clicked) emit(this.userID1, 1);
    if (!this.user1Clicked) emit(this.userID1, 0);
    if  (this.user2Clicked) emit(this.userID2, 1);
    if (!this.user1Clicked) emit(this.userID2, 0);
  }
  var query = generateMapReduceQuery(user, queue, mapClickProb);
  Conversation.mapReduce(query, function(err, mongoData) {
    findFunction(user, queue, mongoData, partnerCallback)
  });
},

MatchProbHiLo: function(user, queue, partnerCallback) {
  MatchProb(user, queue, findMaxDistance, partnerCallback);
},

MatchProbHiHi: function(user, queue, partnerCallback) {
  MatchProb(user, queue, findMinDistance, partnerCallback);
},

MatchProb: function(user, queue, findFunction, partnerCallback) {
  var mapMatchProb = function() {
    if (this.user1Clicked && this.user2Clicked) {
      emit(this.userID1, 1);
      emit(this.userID2, 1);
    }
    else {
      emit(this.userID1, 0);
      emit(this.userID2, 0);
    }
  }
  var query = generateMapReduceQuery(user, queue, mapMatchProb);
  Conversation.mapReduce(query, function(err, mongoData) {
    findFunction(user, queue, mongoData, partnerCallback)
  });
},

ChatLengthHiLo: function(user, queue, partnerCallback) {
  ChatLength(user, queue, findMaxDistance, partnerCallback);
},

ChatLengthHiHi: function(user, queue, partnerCallback) {
  ChatLength(user, queue, findMinDistance, partnerCallback);
},

ChatLength: function(user, queue, findFunction, partnerCallback) {
  var mapChatLength = function() {
    emit(this.userID1, this.endTime-this.startTime);
    emit(this.userID2, this.endTime-this.startTime);
  }
  var query = generateMapReduceQuery(user, queue, mapChatLength);
  Conversation.mapReduce(query, function(err, mongoData) {
    findFunction(user, queue, mongoData, partnerCallback)
  });
},

LastVisitHiLo: function(user, queue, partnerCallback) {
  LastVisit(user, queue, findMaxDistance, partnerCallback);
},

LastVisitHiHi: function(user, queue, partnerCallback) {
  LastVisit(user, queue, findMinDistance, partnerCallback);
},

LastVisit: function(user, queue, findFunction, partnerCallback) {
  var mapLastVisit = function() {
    emit(this.userID1, this.startTime);
    emit(this.userID2, this.startTime);
  }
  var query = generateMapReduceQuery(user, queue, mapLastVisit);
  Conversation.mapReduce(query, function(err, mongoData) {
    findFunction(user, queue, mongoData, partnerCallback)
  });
},

MessageDiscrepancyHiLo: function(user, queue, partnerCallback) {
  MessageDiscrepancy(user, queue, findMaxDistance, partnerCallback);
},

MessageDiscrepancyHiHi: function(user, queue, partnerCallback) {
  MessageDiscrepancy(user, queue, findMinDistance, partnerCallback);
},

MessageDiscrepancy: function(user, queue, findFunction, partnerCallback) {
  var mapMessageDiscrepancy = function() {
    emit(this.userID1, this.user1MessagesSent - this.user2MessagesSent);
    emit(this.userID2, this.user2MessagesSent - this.user1MessagesSent);
  }
  var query = generateMapReduceQuery(user, queue, mapMessageDiscrepancy);
  Conversation.mapReduce(query, function(err, mongoData) {
    findFunction(user, queue, mongoData, partnerCallback)
  });
},

heuristicFunctions: {
"FIFO": FIFO, "LIFO": LIFO, "Random": Random, 
"ChatLengthHiLo": ChatLengthHiLo, "ChatLengthHiHi": ChatLengthHiHi, 
"LastVisitHiLo": LastVisitHiLo, "LastVisitHiHi": LastVisitHiHi, 
"ClickProbHiLo": ClickProbHiLo, "ClickProbHiHi": ClickProbHiHi, 
"MatchProbHiLo": MatchProbHiLo, "MatchProbHiHi": MatchProbHiHi, 
"MessagesSentHiLo": MessagesSentHiLo, 
"MessagesSentHiHi": MessagesSentHiHi, 
"MessagesReceivedHiLo": MessagesReceivedHiLo, 
"MessagesReceivedHiHi": MessagesReceivedHiHi, 
"MessageDiscrepancyHiLo": MessageDiscrepancyHiLo,
"MessageDiscrepancyHiHi": MessageDiscrepancyHiHi
},

// FIXME: IMPLEMENT
pickHeuristic: function(user, queue, partnerCallback, heuristicCallback) {

  var query = {};
  query.map = function() {
    if (this.user1Clicked && this.user2Clicked) {
      emit(this.matchingHeuristic, {plays:1, wins:1});
      emit("AllHeuristics", {plays: 1, wins: 1});
    }
    else {
      emit(this.matchingHeuristic, {plays:1, wins:0});
      emit("AllHeuristics", {plays: 1, wins: 0});
    }
    
  };
  query.reduce = function(k, v) {
    var sum = 0.0;
    var length = v.length;
    var output = {plays: 0, wins: 0};

    for (var i = 0; i < length; i++) {
      output.plays += v[i].plays;
      output.wins += v[i].wins;
    }
    return output;
  }

  Conversation.mapReduce(query, function(err, mongoData) {
    UCB1(mongoData, heuristicCallback)
  });

},



  // for each matching heuristic, calculate UCB value and
  // find the maximum value and choose it as the heuristic
  /* for (var i = 0; i < heuristics.length; i++) {
    var currentValue = findHeuristicAndExecute(heuristics[i], UCB1);
    if (currentValue > currentMax) {
      currentBestHeuristic = heuristics[i];
      currentMax = currentValue;
    }*/ 

/******************************************************************************
* Implement UCB1 function
******************************************************************************/

UCB1: function(mongoData, heuristicCallback) {

// FIXME: CHECK THE FORMAT OF MONGODATA
  var lookup = {};
  var mongoLength = mongoData.length;
  for (var i = 0; i < mongoLength; i++) {
      lookup[mongoData[i]["_id"]] = mongoData[i]["value"];
  }

  var heuristicsLength = heuristics.length;
  for (var i = 0; i < heuristicsLength; i++) {
    var probabilityEstimate = lookup[heuristics[i]].wins/lookup[heuristics[i]].plays;
    var UCBoundEstimate = Math.sqrt(2*Math.log(lookup["AllHeuristics"].plays)/lookup[heuristics[i]].plays);

    // HOW DO YOU CHECK FOR 0 PLAYS?

  var probabilityEstimate = thisHeuristicsSuccesses/thisHeuristicsPlays;
  var UCBoundEstimate = Math.sqrt(2*Math.log(allPlays)/thisHeuristicsPlays);
  // if (thisHeuristicsPlays > 0) return (probabilityEstimate + UCBoundEstimate);
  // by making the first return value POSITIVE_INFINITY, we ensure that each arm is played once first
  //else return Number.POSITIVE_INFINITY;

}

  // FIXME: end up with the chosenHeuristic
  heuristicCallback("MessagesSentHiHi");
} 

// helper functions 

generateMapReduceQuery: function (user, queue, mapFunction) {

  var mapReduce = {};
  
  // map function provided by user
  mapReduce.map = mapFunction;

  // take the average value of the computed values from the
  // map function
  mapReduce.reduce = function(k, v) {
    var sum = 0.0;
    var length = v.length;

    for (var i = 0; i < length; i++) {
      sum += v[i];
    }

    return (sum/length);
  }

  // filter to only user and potential partners in the queue
  orQuery = [{userID1: user.id}, {userID2: user.id}];
  var length = queue.length;
  for (var i = 0; i < length; i++) {
    orQuery.push({userID1: queue[i].id});
    orQuery.push({userID2: queue[i].id});
  }
  mapReduce.query = {$or: orQuery};

  return mapReduce;

},

findMaxDistance: function(user, queue, mongoData, partnerCallback) {

  var lookup = {};
  var mongoLength = mongoData.length;
  for (var i = 0; i < mongoLength; i++) {
      lookup[mongoData[i]["_id"]] = mongoData[i]["value"];
  }

  userValue = lookup[user.id];

  // initialize running max variables
  var bestDistance = Number.NEGATIVE_INFINITY;
  var bestMatch = null;
  var queueLength = queue.length;

  for (var i = 0; i < queueLength; i++) {
    var currentValue = lookup[queue[i].id];
    var currentDist = Math.abs(currentValue - userValue);
    if (currentDist >= bestDistance) {
      bestMatch = queue[i];
      bestDistance = currentDist;
    }
  }

  queue.splice(queue.indexOf(bestMatch), 1);
  partnerCallback(bestMatch);

},

findMinDistance: function(user, queue, mongoData, partnerCallback) {

  var lookup = {};
  var mongoLength = mongoData.length;
  for (var i = 0; i < mongoLength; i++) {
      lookup[mongoData[i]["_id"]] = mongoData[i]["value"];
  }

  userValue = lookup[user.id];

  // initialize running max variables
  var bestDistance = Number.POSITIVE_INFINITY;
  var bestMatch = null;
  var queueLength = queue.length;

  for (var i = 0; i < queueLength; i++) {
    var currentValue = lookup[queue[i].id];
    var currentDist = Math.abs(currentValue - userValue);
    if (currentDist <= bestDistance) {
      bestMatch = queue[i];
      bestDistance = currentDist;
    }
  }

  queue.splice(queue.indexOf(bestMatch), 1);
  partnerCallback(bestMatch);

}
}
