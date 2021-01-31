// game variables
var dx = -40; var dy = 20; // the step in the x and y directions
var div = 20000;/* I will arbitrarily divide the height and width by this
                  number. This will help with measuring the step by which
                  to move the ball */
    

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
})

server.listen(process.env.PORT || 5000, function() {
  console.log('Starting server on port 5000');
});

// *** GAME LOGIC ***

var state = {};
state['ball'] = {x:div/2, y:div/2, paused:0}; // div/2 puts the ball in the middle of the screen
state['blockHeight'] = 0;
state['players'] = {};
state['mode'] = 0; // 0: menu, 1:single player, 2:multiplayer
state['dims'] = {}; // width and height to be used for both player's canvases
var players = {}; 
var id1,id2;


io.on('connection', function(socket) 
{	
  socket.on('new player', function(dims) 
  { 
    console.log("player entered: " );
  
    if(Object.keys(players).length == 0){
      players[socket.id] = { x:0, y:0, score:0};	
      id1 = socket.id;
      state['players']= players; 
      state['mode']=0;
      state['dims']=dims;
      io.sockets.emit('state', state);
    }

    else if (Object.keys(players).length == 1){
      players[socket.id] = { x: dims.x, y:0, score:0};
      id2 = socket.id;
      state['mode']=2;
      state['dims']=dims;
      io.sockets.emit('state', state);
      state.ball.paused=1; pause();
    } 

    // else spectators? 
  });
  
  socket.on('disconnect', function() {
	  var id = socket.id;
    delete players[id];
    if(state.mode==2)
      state.mode=1;
	  console.log("player left" );
  });
  
  socket.on('state', function(data) {
    state.mode = data.mode;
    state.blockHeight = data.height;
    players[socket.id].y = data.y;
  });
});

function pause(){
  setTimeout(function(){
    state.ball.paused = 0;
  },1500)
}

function leftHit(y){

  if(players[id1].y<y && y<players[id1].y+(div/7))
    return true;
  else
    return false;
}

function rightHit(y){
  if(state.mode==1){
    return true;
  }
  if(players[id2].y<y && y<players[id2].y+div/7)
    return true;
  else
    return false;
}

function updateBall(){
  var ballRadius = 45*Math.round(state.dims.y/div); // ball radius=20 + border width = 5
  var blockWidth = div/40;
  x = state.ball.x;
  y = state.ball.y;
  if (x + dx < blockWidth+ballRadius){
    if(leftHit(y)){
      dx = -dx; 
      x -= dx;
    }
    else{
      x=div/2; y=div/2;
      if(state.mode==2){
        players[id2].score++;
      }
      state.ball.paused=1; pause();
    }
  }

  if (x + dx > (state.mode==2 ? div-blockWidth : div-ballRadius)){
    if(rightHit(y)){
      dx = -dx; 
      x -= dx;
    }
    else{
      x=div/2; y=div/2;
      if(state.mode==2){
        players[id1].score++;
      }
      state.ball.paused=1; pause();
    }
  }

  if (y + dy > div-ballRadius || y + dy < ballRadius)
    {dy = -dy; y -= dy;}

  x += dx;
  y += dy;

  state.ball.x = x;
  state.ball.y = y;
}

// send out 60 times/sec the state to the 2 players
setInterval(function() {
  if(state.mode!=0){
    if(state.ball.paused == 0)
      updateBall();	
    state['players']= players; 
    io.sockets.emit('state', state);
  }
}, 1000 / 60);

