var crypto = require('crypto'),
    express = require('express'),
    app = express(),
    princeton = require('./server/princeton');

var port = process.env.PORT || 3000;
app.listen(port);
console.log('Express listening on port ' + port);

app.configure('development', function() {
  var liveReloadPort = 35729;
  app.use(require('connect-livereload')({
    port: liveReloadPort
  }));
});

app.use(express.cookieParser());

app.get('/about', function(req, res) {
  res.sendfile(__dirname + '/public/about.html');
});

app.get('/chat', function(req, res) {
  if (!req.cookies.userID) {
    // Determine domain
    var cookieDomain;
    var splitHost = req.get('host').split('.');
    if (splitHost.length > 1) {
      cookieDomain = '.' + splitHost.slice(-2).join('.');
    }

    // Set cookie
    crypto.pseudoRandomBytes(16, function(err, buff) {
     res.cookie('userID', buff.toString('hex'), {
       maxAge: 60*60*24*356*1000,
       domain: cookieDomain
     });
   });
  }
  res.sendfile(__dirname + '/public/chat.html');
});

app.get('/socket.io.js', function(req, res) {
  res.sendfile(__dirname + '/node_modules/socket.io-client/dist/socket.io.min.js');
});

app.use(express.static(__dirname + '/public'));
