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

server.listen(process.env.PORT || 5000, function() {
  console.log('Starting server on port 5000');
});

// *** GAME LOGIC ***
var state = {};
state['ball'] = {x:500,y:500, paused:0};
state['players'] = {};
var players = {}; 
var id1,id2;


io.on('connection', function(socket) 
{	
  socket.on('new player', function() 
  { 
    console.log("player entered: " );
  
    if(Object.keys(players).length == 0){
      players[socket.id] = { x:0, y:0, score:0 };	
      id1 = socket.id;
    }

    else if (Object.keys(players).length == 1){
      players[socket.id] = { x: 770, y:0, score:0  };
      id2 = socket.id;
      state.ball.paused=1; pause();
    } 
  });
  
  socket.on('disconnect', function() {
	var id = socket.id;
    delete players[id];
	console.log("player left" );
  });
  
  socket.on('movement', function(data) {
    players[socket.id].y = data;
  });
});

function pause(){
  setTimeout(function(){
    state.ball.paused = 0;
  },1500)
}

function leftHit(y){
  if(players[id1].y<y && y<players[id1].y+100)
    return true;
  else
    return false;
}

function rightHit(y){
  if(players[id2].y<y && y<players[id2].y+100)
    return true;
  else
    return false;
}

function updateBall(){
  x = state.ball.x;
  y = state.ball.y;
  if (x + dx < 40){
    if(leftHit(y)){
      dx = -dx; 
      x -= dx;
    }
    else{
      x=500; y=500;
      players[id2].score++;
      state.ball.paused=1; pause();
    }
  }
  if (x + dx > 960){
    if(rightHit(y)){
      dx = -dx; 
      x -= dx;
    }
    else{
      x=500; y=500;
      players[id1].score++;
      state.ball.paused=1; pause();
    }
  }
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
    if(state.ball.paused == 0)
      updateBall();	
  }
  state['players']= players; 
  io.sockets.emit('state', state);
}, 1000 / 60);

