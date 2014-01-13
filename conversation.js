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

var heuristics = ["FIFO", "LIFO", "Random", "ChatLengthHiLo", 
"ChatLengthHiHi", "LastVisitHiLo", "LastVisitHiHi", "ClickProbHiLo", 
"ClickProbHiHi", "MatchProbHiLo", "MatchProbHiHi", "MessagesSentHiLo", 
"MessagesSentHiHi", "MessagesReceivedHiLo", "MessagesReceivedHiHi", 
"MessageDiscrepancyHiLo", "MessageDiscrepancyHiHi"];

// This function returns the first element of the queue 
// (i.e. First In First Out, or the least recently added)
var FIFO = function(user, queue, partnerCallback) {
  partnerCallback(queue.shift());
}

// This function returns the last element of the queue
// (i.e. Last In First Out, or the most recently added)
var LIFO = function(user, queue, partnerCallback) {
  partnerCallback(queue.pop());
}

// This function returns a random element of the queue
var Random = function(user, queue, partnerCallback) {
  var randomIndex = Math.floor(Math.random()*queue.length);
  var randomUser = queue[randomIndex];
  queue.splice(randomIndex, 1); // remove randomUser from queue
  partnerCallback(randomUser);
}

// USE THIS DESIGN PATTERN
var MessagesSentHiLo = function(user, queue, partnerCallback) {
  MessagesSent(user, queue, findMaxDistance, partnerCallback);
}

var MessagesSentHiHi = function(user, queue, partnerCallback) {
  MessagesSent(user, queue, findMinDistance, partnerCallback);
}

var MessagesSent = function(user, queue, findFunction, partnerCallback) {
  var mapMessagesSent = function() {
    emit (this.userID1, this.user1MessagesSent); 
    emit (this.userID2, this.user2MessagesSent);
  };
  var query = generateMapReduceQuery(user, queue, mapMessagesSent);
  Conversation.mapReduce(query, function(err, mongoData) {
    findFunction(user, queue, mongoData, partnerCallback)
  });
}

var MessagesReceivedHiLo = function(user, queue, partnerCallback) {
  MessagesReceived(user, queue, findMaxDistance, partnerCallback);
}

var MessagesReceivedHiHi = function(user, queue, partnerCallback) {
  MessagesReceived(user, queue, findMinDistance, partnerCallback);
}

var MessagesReceived = function(user, queue, findFunction, partnerCallback) {
  var mapMessagesReceived = function() {
    emit (this.userID1, this.user2MessagesSent);
    emit (this.userID2, this.user1MessagesSent);
  };
  var query = generateMapReduceQuery(user, queue, mapMessagesReceived);
  Conversation.mapReduce(query, function(err, mongoData) {
    findFunction(user, queue, mongoData, partnerCallback)
  });
}

var ClickProbHiLo = function(user, queue, partnerCallback) {
  ClickProb(user, queue, findMaxDistance, partnerCallback);
}

var ClickProbHiHi = function(user, queue, partnerCallback) {
  ClickProb(user, queue, findMinDistance, partnerCallback);
}

var ClickProb = function(user, queue, findFunction, partnerCallback) {
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
}

var MatchProbHiLo = function(user, queue, partnerCallback) {
  MatchProb(user, queue, findMaxDistance, partnerCallback);
}

var MatchProbHiHi = function(user, queue, partnerCallback) {
  MatchProb(user, queue, findMinDistance, partnerCallback);
}

var MatchProb = function(user, queue, findFunction, partnerCallback) {
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
}

var ChatLengthHiLo = function(user, queue, partnerCallback) {
  ChatLength(user, queue, findMaxDistance, partnerCallback);
}

var ChatLengthHiHi = function(user, queue, partnerCallback) {
  ChatLength(user, queue, findMinDistance, partnerCallback);
}

var ChatLength = function(user, queue, findFunction, partnerCallback) {
  var mapChatLength = function() {
    emit(this.userID1, this.endTime-this.startTime);
    emit(this.userID2, this.endTime-this.startTime);
  }
  var query = generateMapReduceQuery(user, queue, mapChatLength);
  Conversation.mapReduce(query, function(err, mongoData) {
    findFunction(user, queue, mongoData, partnerCallback)
  });
}

var LastVisitHiLo = function(user, queue, partnerCallback) {
  LastVisit(user, queue, findMaxDistance, partnerCallback);
}

var LastVisitHiHi = function(user, queue, partnerCallback) {
  LastVisit(user, queue, findMinDistance, partnerCallback);
}

var LastVisit = function(user, queue, findFunction, partnerCallback) {
  var mapLastVisit = function() {
    emit(this.userID1, this.startTime);
    emit(this.userID2, this.startTime);
  }
  var query = generateMapReduceQuery(user, queue, mapLastVisit);
  Conversation.mapReduce(query, function(err, mongoData) {
    findFunction(user, queue, mongoData, partnerCallback)
  });
}

var MessageDiscrepancyHiLo = function(user, queue, partnerCallback) {
  MessageDiscrepancy(user, queue, findMaxDistance, partnerCallback);
}

var MessageDiscrepancyHiHi = function(user, queue, partnerCallback) {
  MessageDiscrepancy(user, queue, findMinDistance, partnerCallback);
}

var MessageDiscrepancy = function(user, queue, findFunction, partnerCallback) {
  var mapMessageDiscrepancy = function() {
    emit(this.userID1, this.user1MessagesSent - this.user2MessagesSent);
    emit(this.userID2, this.user2MessagesSent - this.user1MessagesSent);
  }
  var query = generateMapReduceQuery(user, queue, mapMessageDiscrepancy);
  Conversation.mapReduce(query, function(err, mongoData) {
    findFunction(user, queue, mongoData, partnerCallback)
  });
}

var heuristicFunctions = {
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
};

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
 exports.pickPartner = function (user, queue, partnerCallback) {

  pickHeuristic(user, queue, partnerCallback, function(chosenHeuristic) {
    user.conversation.matchingHeuristic = chosenHeuristic;
    heuristicFunctions[chosenHeuristic](user, queue, partnerCallback);
  });

}

// FIXME: IMPLEMENT
var pickHeuristic = function(user, queue, partnerCallback, heuristicCallback)
{

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

}



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

var UCB1 = function(mongoData, heuristicCallback) {

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

var generateMapReduceQuery = function (user, queue, mapFunction) {

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

}

var findMaxDistance = function(user, queue, mongoData, partnerCallback) {

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

};

var findMinDistance = function(user, queue, mongoData, partnerCallback) {

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

};
