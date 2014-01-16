var largePositiveNumber = 1000000000;
var largeNegativeNumber = -1000000000;

/******************************************************************************
* Implement UCB1 function
******************************************************************************/

var UCB1 = function(mongoData, heuristicCallback) {
  console.log("Running UCB algorithm to select heuristic.");
  var heuristicList = module.exports.list;
  var finalData = {};

  // if there is no data, set all heuristics to a large positive number
  if (typeof(mongoData) === "undefined") {
    for (var i = 0; i < heuristicList.length; i++) {
      finalData[heuristicList[i]] = largePositiveNumber;
    }
  } else {
    var mongoLookup = {};
    for (var i = 0; i < mongoData.length; i++) {
      mongoLookup[mongoData[i]["_id"]] = mongoData[i]["value"];
    }
    for (var i = 0; i < heuristicList.length; i++) {
      if (typeof(mongoLookup[heuristicList[i]]) === "undefined") {
       finalData[heuristicList[i]] = largePositiveNumber;
      } else {
        // calculate UCB value for the current heuristic
        var probabilityEstimate = mongoLookup[heuristicList[i]].wins/mongoLookup[heuristicList[i]].plays;
        var UCBoundEstimate = Math.sqrt(2*Math.log(mongoLookup["AllHeuristics"].plays)/mongoLookup[heuristicList[i]].plays);
        finalData[heuristicList[i]] = probabilityEstimate + UCBoundEstimate;
      }
    }
  }

  // initialize running max variables
  var bestValue = largeNegativeNumber;
  var bestMatch = null;

  for (var i = 0; i < heuristicList.length; i++) {
    var currentValue = finalData[heuristicList[i]];
    if (currentValue >= bestValue) {
      bestMatch = heuristicList[i];
      bestValue = currentValue;
    }
  }

  console.log("UCB1 selected the \"" + bestMatch + "\" heuristic.");

  heuristicCallback(bestMatch);
};

/******************************************************************************
* Implement helper functions
******************************************************************************/

// Function to get the mongoose map-reduce query given the heuristic object
var getQuery = function(user, queue, heuristic) {

  var mapReduce = {};

  // map function provided by user
  mapReduce.map = heuristic.mapFunction;

  // take the average value of the computed values from the
  // map function
  mapReduce.reduce = function(k, v) {
    var sum = 0;

    for (var i = 0; i < v.length; i++) {
      if (typeof(v[i]) === "boolean" && v[i]) sum++;
      else sum += v[i];
    }

    return (sum/v.length);
  }

  // filter to only user and potential partners in the queue
  orQuery = [{userID1: user.id}, {userID2: user.id}];
  for (var i = 0; i < queue.length; i++) {
    orQuery.push({userID1: queue[i].id});
    orQuery.push({userID2: queue[i].id});
  }
  mapReduce.query = {$or: orQuery};

  return mapReduce;
};

// Find the partner in the queue with the max distance from the user
// based on the mongoData array.
var findMaxDistance = function(user, queue, mongoData, partnerCallback) {
  console.log("Finding max distance between user and queue for the heuristic.");
  var finalData = {};

  if (typeof(mongoData) === "undefined") {
    for (var i = 0; i < queue.length; i++) {
      finalData[queue[i].id] = largeNegativeNumber;
    }
  } else {
    var mongoLookup = {};
    for (var i = 0; i < mongoData.length; i++) {
      mongoLookup[mongoData[i]["_id"]] = mongoData[i]["value"];
    }

    for (var i = 0; i < queue.length; i++) {
      if (typeof(mongoLookup[queue[i].id]) === "undefined") {
        finalData[queue[i].id] = largeNegativeNumber;
      }
      else {
        finalData[queue[i].id] = mongoLookup[queue[i].id];
      }
    }
  }

  // if it's a new user
  if (typeof(finalData[user.id]) === "undefined") {
    var userValue = largeNegativeNumber;
  }
  else {
    var userValue = finalData[user.id];
  }

  // initialize running max variables
  var bestDistance = largeNegativeNumber;
  var bestMatch = null;

  for (var i = 0; i < queue.length; i++) {
    var currentValue = finalData[queue[i].id];
    var currentDist = Math.abs(currentValue - userValue);
    if (currentDist >= bestDistance) {
      bestMatch = queue[i];
      bestDistance = currentDist;
    }
  }

  queue.splice(queue.indexOf(bestMatch), 1);
  partnerCallback(bestMatch);
};

// Find the partner in the queue with the min distance from the user
// based on the mongoData array.
var findMinDistance = function(user, queue, mongoData, partnerCallback) {
  console.log("Finding min distance between user and queue for the heuristic");

  var finalData = {};

  if (typeof(mongoData) === "undefined") {
    for (var i = 0; i < queue.length; i++) {
      finalData[queue[i].id] = largePositiveNumber;
    }
  } else {
    var mongoLookup = {};
    for (var i = 0; i < mongoData.length; i++) {
      mongoLookup[mongoData[i]["_id"]] = mongoData[i]["value"];
    }

    for (var i = 0; i < queue.length; i++) {
      if (typeof(mongoLookup[queue[i].id]) === "undefined") {
        finalData[queue[i].id] = largePositiveNumber;
      } else {
        finalData[queue[i].id] = mongoLookup[queue[i].id];
      }
    }
  }

  // if it's a new user
  if (typeof(finalData[user.id]) === "undefined") {
    var userValue = largePositiveNumber;
  } else {
    var userValue = finalData[user.id];
  }

  // initialize running max variables
  var bestDistance = largePositiveNumber;
  var bestMatch = null;

  for (var i = 0; i < queue.length; i++) {
    var currentValue = finalData[queue[i].id];
    var currentDist = Math.abs(currentValue - userValue);
    if (currentDist <= bestDistance) {
      bestMatch = queue[i];
      bestDistance = currentDist;
    }
  }

  queue.splice(queue.indexOf(bestMatch), 1);
  partnerCallback(bestMatch);
};


/******************************************************************************
* Heuristics to be used to match users, as well as public functions to
* use the UCB1 algorithm to pick the heuristic and implement a given heuristic
* to pair two users for conversation.
******************************************************************************/

module.exports = {
  list: ["FIFO", "LIFO", "Random", "ChatLengthHiLo", "ChatLengthHiHi",
  "LastVisitHiLo", "LastVisitHiHi", "ClickProbHiLo", "ClickProbHiHi",
  "MatchProbHiLo", "MatchProbHiHi", "MessagesSentHiLo", "MessagesSentHiHi",
  "MessagesReceivedHiLo", "MessagesReceivedHiHi", "MessageDiscrepancyHiLo",
  "MessageDiscrepancyHiHi"],

  FIFO: {
    requiresData: false,
    overrideFunction: function(user, queue, partnerCallback) {
      partnerCallback(queue.shift());
    },
    findFunction: null,
    mapFunction: null
  },

  LIFO: {
    requiresData: false,
    overrideFunction: function(user, queue, partnerCallback) {
      partnerCallback(queue.pop());
    },
    findFunction: null,
    mapFunction: null
  },

  Random: {
    requiresData: false,
    overrideFunction: function(user, queue, partnerCallback) {
      var randomIndex = Math.floor(Math.random()*queue.length);
      var randomUser = queue[randomIndex];
      queue.splice(randomIndex, 1); // remove randomUser from queue
      partnerCallback(randomUser);
    },
    findFunction: null,
    mapFunction: null
 },

  ChatLengthHiLo: {
    requiresData: true,
    overrideFunction: null,
    findFunction: findMaxDistance,
    mapFunction: function() {
      var endTime = new Date(this.endTime);
      var startTime = new Date(this.endTime);

      emit(this.userID1, endTime.getTime() - startTime.getTime());
      emit(this.userID2, endTime.getTime() - startTime.getTime());
    }
  },

  ChatLengthHiHi: {
    requiresData: true,
    overrideFunction: null,
    findFunction: findMinDistance,
    mapFunction: function() {
      var endTime = new Date(this.endTime);
      var startTime = new Date(this.endTime);

      emit(this.userID1, endTime.getTime() - startTime.getTime());
      emit(this.userID2, endTime.getTime() - startTime.getTime());
    }
  },

  LastVisitHiLo: {
    requiresData: true,
    overrideFunction: null,
    findFunction: findMaxDistance,
    mapFunction: function () {
      var startTime = new Date(this.endTime);
      emit(this.userID1, startTime.getTime());
      emit(this.userID2, startTime.getTime());
    }
  },

  LastVisitHiHi: {
    requiresData: true,
    overrideFunction: null,
    findFunction: findMinDistance,
    mapFunction: function () {
      var startTime = new Date(this.endTime);
      emit(this.userID1, startTime.getTime());
      emit(this.userID2, startTime.getTime());
    }
  },

  ClickProbHiLo: {
    requiresData: true,
    overrideFunction: null,
    findFunction: findMaxDistance,
    mapFunction: function() {
      emit(this.userID1, this.user1Clicked);
      emit(this.userID2, this.user2Clicked);
    }
  },

  ClickProbHiHi: {
    requiresData: true,
    overrideFunction: null,
    findFunction: findMinDistance,
    mapFunction: function() {
      emit(this.userID1, this.user1Clicked);
      emit(this.userID2, this.user2Clicked);
    }
  },

  MatchProbHiLo: {
    requiresData: true,
    overrideFunction: null,
    findFunction: findMaxDistance,
    mapFunction: function() {
      var matched = (this.user1Clicked && this.user2Clicked);
      emit(this.userID1, matched);
      emit(this.userID2, matched);
    }
  },

  MatchProbHiHi: {
    requiresData: true,
    overrideFunction: null,
    findFunction: findMinDistance,
    mapFunction: function() {
      var matched = (this.user1Clicked && this.user2Clicked);
      emit(this.userID1, matched);
      emit(this.userID2, matched);
    }
  },

  MessagesSentHiLo: {
    requiresData: true,
    overrideFunction: null,
    findFunction: findMaxDistance,
    mapFunction: function() {
      emit(this.userID1, this.user1MessagesSent);
      emit(this.userID2, this.user2MessagesSent);
    }
  },

  MessagesSentHiHi: {
    requiresData: true,
    overrideFunction: null,
    findFunction: findMinDistance,
    mapFunction: function() {
      emit(this.userID1, this.user1MessagesSent);
      emit(this.userID2, this.user2MessagesSent);
    }
  },

  MessagesReceivedHiLo: {
    requiresData: true,
    overrideFunction: null,
    findFunction: findMaxDistance,
    mapFunction: function () {
      emit(this.userID1, this.user2MessagesSent);
      emit(this.userID2, this.user1MessagesSent);
    }
  },

  MessagesReceivedHiHi: {
    requiresData: true,
    overrideFunction: null,
    findFunction: findMinDistance,
    mapFunction: function () {
      emit(this.userID1, this.user2MessagesSent);
      emit(this.userID2, this.user1MessagesSent);
    }
  },

  MessageDiscrepancyHiLo: {
    requiresData: true,
    overrideFunction: null,
    findFunction: findMaxDistance,
    mapFunction: function () {
      emit(this.userID1, this.user1MessagesSent - this.user2MessagesSent);
      emit(this.userID2, this.user2MessagesSent - this.user1MessagesSent);
    }
  },

  MessageDiscrepancyHiHi: {
    requiresData: true,
    overrideFunction: null,
    findFunction: findMinDistance,
    mapFunction: function () {
      emit(this.userID1, this.user1MessagesSent - this.user2MessagesSent);
      emit(this.userID2, this.user2MessagesSent - this.user1MessagesSent);
    }
  },

  pick: function(dbHandle, user, queue, partnerCallback, heuristicCallback) {
    console.log("Currently picking heuristic to match users.");
    var query = {};
    query.map = function() {
      if (this.user1Clicked && this.user2Clicked) {
        emit(this.matchingHeuristic, {plays:1, wins:1});
        emit("AllHeuristics", {plays: 1, wins: 1});
      } else {
        emit(this.matchingHeuristic, {plays:1, wins:0});
        emit("AllHeuristics", {plays: 1, wins: 0});
      }
    };

    query.reduce = function(k, v) {
      var sum = 0.0;
      var output = {plays: 0, wins: 0};

      for (var i = 0; i < v.length; i++) {
        output.plays += v[i].plays;
        output.wins += v[i].wins;
      }
      return output;
    };

    dbHandle.mapReduce(query, function(err, mongoData) {
      UCB1(mongoData, heuristicCallback)
    });
  },

  execute: function(dbHandle, user, queue, partnerCallback, heuristic) {
    console.log("Executing heuristic now.");
    if (heuristic.requiresData) {
      var findFunction = heuristic.findFunction;
      var query = getQuery(user, queue, heuristic);
      dbHandle.mapReduce(query, function(err, mongoData) {
        findFunction(user, queue, mongoData, partnerCallback);
      });
    } else {
      heuristic.overrideFunction(user, queue, partnerCallback);
    }
  }
}
