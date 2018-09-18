// game variables
var dx = -5; var dy = 1;

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

// *** GAME LOGIC ***
var state = {};
state['ball'] = {x:500,y:500};
state['players'] = {};
var players = {}; 


io.on('connection', function(socket) 
{	
  socket.on('new player', function() 
  { 
    console.log("player entered: " );
  
    if(Object.keys(players).length == 0)
      players[socket.id] = { x:0, y:0, score:0 };	

    else if (Object.keys(players).length == 1)
      players[socket.id] = { x: 770, y:0, score:0  };
	 
  });
  
  socket.on('disconnect', function() {
	var id = socket.id;
    delete players[id];
	console.log("player left" );
  });
  
  socket.on('movement', function(data) {
    var player = players[socket.id] || {};
	player.y = data;
  });
});



function updateBall(){
  x = state.ball.x;
  y = state.ball.y;
  if (x + dx > 1000 || x + dx < 0)
    {dx = -dx; x -= dx;}
  if (y + dy > 1000 || y + dy < 0)
    {dy = -dy; y -= dy;}

  x += dx;
  y += dy;

  state.ball.x = x;
  state.ball.y = y;
}

// send out 60 times/sec the state to the 2 players
setInterval(function() {
  if(Object.keys(players).length == 2){
    updateBall();	
  }
  state['players']= players; 
  io.sockets.emit('state', state);
}, 1000 / 60);

