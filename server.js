// Dependencies.
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('port', 5000);
app.use('/public', express.static(__dirname + '/public'));
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'pong.html'));
})

server.listen(process.env.PORT || 5000, function() {
  console.log('Starting server on port 5000');
});

// *** GAME LOGIC ***
// game variables
var globals = {div: 20000,             // virtual grid size
  dx: 80, dy: 0,                       // arbitrary step size for ball movement
  ballRadius: 500,                     // virtual ball radius (will be translated in canvas.js)
  block: {width:400, height:2000}};    // virtual block size (will be translated in canvas.js)
var state = {};
state['ball'] = {x:globals.div/2, 
                 y:globals.div/2,
                 dx:globals.dx,
                 dy:globals.dy,
                 paused:0};
state['players'] = {};
state['mode'] = 0;                     // 0: menu, 1:single player, 2:multiplayer
var players = {}; 
var id1,id2;

io.on('connection', function(socket) 
{	
  socket.on('new player', function() 
  { 
    console.log("player entered: " );
    
    // first player to enter
    if(Object.keys(players).length == 0){
      players[socket.id] = { x:0, y:0, score:0};	
      id1 = socket.id;
      state['players']= players; 
      state['mode']=0;
      io.sockets.emit('state', state);
    }

    //second player to enter
    else if (Object.keys(players).length == 1){
      players[socket.id] = { x: dims.x, y:0, score:0};
      id2 = socket.id;
      state['mode']=2;
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
    players[socket.id].y = data.y;
  });
});

// used after a player scores
function pause(){
  setTimeout(function(){
    state.ball.paused = 0;
  },1500)
}

function leftHit(y){
  if( players[id1].y<y && y<(players[id1].y + globals.block.height) )
    return true;
  else
    return false;
}

function rightHit(y){
  if(state.mode==1){
    return true;
  }
  if(players[id2].y<y && y<(players[id2].y + globals.block.height) )
    return true;
  else
    return false;
}

function updateBall(){
  x = state.ball.x;
  y = state.ball.y;
  nextX = x + globals.dx; // new positions after step is applied
  nextY = y + globals.dy; //
  
  //check left boundary
  if (nextX < globals.block.width+globals.ballRadius/2){
    if(leftHit(y)){
      globals.dx = -globals.dx; 
      x = globals.ballRadius;
    }
    else{
      x=globals.div/2; 
      y=globals.div/2;
      if(state.mode==2)
        players[id2].score++;
      state.ball.paused=1; pause();
    }
  }

  //check right boundary
  if (nextX > (state.mode==2 ? globals.div-globals.block.width : globals.div-globals.ballRadius/2)){
    if(rightHit(y)){
      globals.dx = -globals.dx; 
      x = globals.div-globals.block.width;
    }
    else{
      x=globals.div/2; 
      y=globals.div/2;
      if(state.mode==2){
        players[id1].score++;
      }
      state.ball.paused=1; pause();
    }
  }

  //check bottom boundary
  if (nextY > globals.div-globals.ballRadius){
    y = globals.div - globals.ballRadius;
    globals.dy = -globals.dy; 
  }

  //check top boundary
  else if(nextY < globals.ballRadius){
    y = globals.ballRadius;
    globals.dy = -globals.dy;     
  }
  
  // non edge cases
  else{
    x += globals.dx;
    y += globals.dy;  
  }

  state.ball.x = x;
  state.ball.y = y;
}

// send out 60 times/sec the state to the 2 players
setInterval(function() {
  if(state.mode){
    if(state.ball.paused == 0)
      updateBall();	
    state['players']= players; 
    io.sockets.emit('state', state);
  }
}, 1000 / 10);