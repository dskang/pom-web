exports.getWelcomeMessage = function() {
  return 'Welcome to Tigers Anonymous!';
}

exports.getWaitingMessage = function() {
  return 'Waiting for another Princeton student to join...';
}

exports.getConnectedMessage = function() {
  return "You're now chatting with another Princeton student. If you're feeling spontaneous, why don't you get the conversation started with the question, ";
}

exports.getConnectedQuestion = function() {
  var randomIndex = Math.floor(Math.random()*questionList.length);
  var randomQuestion = questionList[randomIndex];
  return '"' + randomQuestion + '"';
}

exports.getDisconnectedMessage = function(user) {
  var userName = user.conversation.revealed ? user.name : 'Anonymous Tiger';
  return userName + ' has disconnected. Refresh the page to start another chat!';
}

var questionList = [
"What's your favorite color?"
,"What animal is your Patronus?"
,"If you ruled the world, what laws would you make?"
,"If you were a super hero what powers would you have?"
,"What's your superhero name?"
,"What was your last dream about?"
,"What would you do if you won the lottery?"
,"What does your dream house look like?"
,"What was your favorite vacation?"
,"Where would your dream vacation be?"
,"If you could go back in time to change one thing what would it be?"
,"What's the greatest invention of all time?"
,"Have you ever been admitted to the hospital?"
,"Have you ever had any brushes with the law?"
,"Have you ever played a practical joke on anyone?"
,"Have you ever been the recipient of a practical joke?"
,"What would be your best achievement to date?"
,"If you could live anywhere, where would it be?"
,"What's your favorite song?"
,"Do you like scary movies?"
,"Whats your favorite ice-cream flavour?"
,"What's your favorite word (inappropriate or otherwise)?"
,"What's your least favorite word?"
,"What's your favorite movie?"
,"What's the longest period of time you've gone without sleep?"
,"Do you have any scars?"
,"If you could change anything about yourself what would it be?"
,"Would you rather trade some intelligence for looks or looks for intelligence?"
,"Have you ever had a secret admirer?"
,"If you could ask your future self one question, what would it be?"
,"If you could breed two animals together to defy the laws of nature, what new animal would you create?"
,"What's the most unusual conversation you've ever had?"
,"Are you a good liar?"
,"What's your favorite joke?"
,"What's the worst present you've ever gotten?"
,"What's your favourite saying?"
,"How do you feel about Facebook?"
,"What's your favorite scent?"
,"What's be your dream car?"
,"Who was the last person to send you a text?"
,"Have you ever accidentally injured anyone?"
,"If you could learn any language fluently what would it be?"
,"What cartoon character would you love to see in 21st century life?"
,"What's your most used word?"
,"Who would you want to play you in a movie of your life?"
,"What's your dream job?"
,"Which song annoys you the most?"
,"How long does it take you to get ready?"
,"Whats your first thought when you wake up?"
,"What animal would like to have as a pet?"
,"If you could steal one thing in the world, what would it be?"
,"What's your favorite Pokemon character?"];