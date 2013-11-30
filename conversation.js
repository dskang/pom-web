var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
 
var conversationSchema = new Schema({
    userID1: Number, 
    userID2: Number, 
    matching_heuristic: Number, 
    chat_length: Number, 
    chat_start_time: Date, 
    clicked: Boolean
  });

module.exports = mongoose.model('Conversation', conversationSchema);