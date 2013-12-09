$(document).ready(function () {
  var log_chat_message = function (message, type) {
    var li = $('<li />').text(message);

    if (type === 'system') {
      li.css({'font-weight': 'bold'});
    } else if (type === 'leave' || type === 'error') {
      li.css({'font-weight': 'bold', 'color': '#F00'});
    }

    $('#chat_log').append(li);
  };

  // FIXME: localhost will not work in production
  var socketPath = 'http://localhost';
  var socket = io.connect(socketPath);

  socket.on('entrance', function (data) {
    log_chat_message(data.message, 'system');
  });

  socket.on('waiting', function (data) {
    log_chat_message(data.message, 'system');
  });

  socket.on('ready', function (data) {
    log_chat_message(data.message, 'system');
  });

  socket.on('exit', function (data) {
    log_chat_message(data.message, 'leave');
  });

  socket.on('chat', function (data) {
    log_chat_message(data.message, 'normal');
  });

  $('#chat_box').keypress(function (event) {
    if (event.which == 13) {
      socket.emit('chat', {
        message: $('#chat_box').val()
      });
      $('#chat_box').val('');
    }
  });
});