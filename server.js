// Dependencies.
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'pong.html'));
});

server.listen(5000, function() {
  console.log('Starting server on port 5000');
});

var players = {}; var i = 0;
io.on('connection', function(socket) {
	
  socket.on('new player', function() {
    if(i == 0){
	  players[socket.id] = { x=0; y=0; i++; };	  
	}
	else if (i == 1){
	  players[socket.id] = { x=window.innerWidth - 230; y=0; i++; };
	}

  });
  
  socket.on('disconnect', function() {
	var id = socket.id;
    delete players[id];
  });
  
  socket.on('movement', function(data) {
    var player = players[socket.id] || {};
	player.y = data;
  });
});

setInterval(function() {
  io.sockets.emit('state', players);
}, 1000 / 60);