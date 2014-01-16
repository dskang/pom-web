var nodemailer = require('nodemailer');

// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP", {
  service: "Gmail",
  auth: {
    user: "tigersanon@gmail.com",
    pass: "originblack"
  }
});

exports.sendMail = function(conversation) {
  var email = {
    from: "TigersAnonymous <tigersanon@gmail.com>",
    to: "tigersanon@gmail.com",
    subject: "Conversation Log - " + (new Date(conversation.startTime)).toString(),
    text: conversation.chatLog +
      "\n--------------------------------------\n\n" +
      "First User: " + conversation.user1.id + " (Origin)" +
      "\nSecond User: " + conversation.user2.id + " (Black)" +
      "\nMatching Heuristic: " + conversation.matchingHeuristic +
      "\nStart Time: " + (new Date(conversation.startTime)).toString() +
      "\nLength: " + ((conversation.endTime - conversation.startTime) / 60000).toFixed(2) + " minutes" +
      "\nButton Displayed: " + (conversation.buttonDisplayed ? "Yes" : "No") +
      "\nUser 1 Clicked: " + (conversation.user1Clicked ? "Yes" : "No") +
      "\nUser 2 Clicked: " + (conversation.user2Clicked ? "Yes" : "No") +
      "\nUser 1 Messages Sent: " + conversation.user1.messagesSent +
      "\nUser 2 Messages Sent: " + conversation.user2.messagesSent
  };

  // send conversation log to tigersanon@gmail.com
  smtpTransport.sendMail(email, function(error, response) {
    if (error) {
      console.log(error);
    } else {
      console.log("Message sent: " + response.message);
    }
  });
};
