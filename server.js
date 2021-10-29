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
var globals = { div: 20000,                          // virtual grid size
                dx: -80, dy: 0,                       // arbitrary step size for ball movement
                ballRadius: 500,                     // virtual ball radius (will be translated in canvas.js)
                block: {width:400, height:3000}};    // virtual block size (will be translated in canvas.js)

var state = {'ball' : {x:globals.div/2, 
                       y:globals.div/2,
                       dx:globals.dx,
                       dy:globals.dy,
                       paused:0},
             'players':{},
             'mode' :0 }; // 0: menu, 1:single player, 2:multiplayer                 
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
      players[socket.id] = { y:0, score:0};
      id2 = socket.id;
      state['players']= players; 
      state['mode']=0;
      io.sockets.emit('state', state);
      //state.ball.paused=1; pause();
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

function leftHit(_ball){ //TO DO: change colors to background on bounce
  hitLength = globals.block.height/2 + globals.ballRadius;
  if( players[id1].y - hitLength <_ball.y && _ball.y<players[id1].y + hitLength ){
    stepUp = _ball.dx>0 ? 20 : -20;
    _ball.dx = -(_ball.dx+stepUp); 
    _ball.x = globals.ballRadius;

    relativeY = _ball.y - players[id1].y ;
    _ball.dy = _ball.dy + relativeY/15;
  }
  else{
    _ball.x=globals.div/2; 
    _ball.y=globals.div/2;
    _ball.dy = 0;
    _ball.dx = -100;
    if(state.mode==2)
      players[id2].score++;
    state.ball.paused=1; pause();
  }
}

function rightHit(_ball){
  if(state.mode==1){
    stepUp = _ball.dx>0 ? 20 : -20;
    _ball.dx = -(_ball.dx+stepUp); 
    _ball.x = globals.div -globals.ballRadius;
    return 0;
  }

  hitLength = globals.block.height/2 + globals.ballRadius;
  if( players[id2].y - hitLength < _ball.y && _ball.y < players[id2].y + hitLength){
    stepUp = _ball.dx>0 ? 20 : -20;
    _ball.dx = -(_ball.dx+stepUp); 
    _ball.x = globals.div-globals.ballRadius;

    relativeY = _ball.y - players[id2].y;
    _ball.dy = _ball.dy + relativeY/15;
  }
  else{
    _ball.x=globals.div/2; 
    _ball.y=globals.div/2;
    _ball.dy = 0;
    _ball.dx = -100;
    if(state.mode==2){
      players[id1].score++;
    }
    state.ball.paused=1; pause();
  }
}

function updateBall(){
  ball = {x: state.ball.x,
          y: state.ball.y,
          dx: globals.dx,
          dy: globals.dy,
          nextX: state.ball.x + globals.dx, // new positions after step is applied
          nextY: state.ball.y + globals.dy};//
  
  //check left boundary
  if (ball.nextX < globals.block.width+globals.ballRadius/2)
    leftHit(ball);

  //check right boundary
  if (ball.nextX > (state.mode==2 ? globals.div-globals.block.width : globals.div-globals.ballRadius/2))
    rightHit(ball);

  //check bottom boundary
  if (ball.nextY > globals.div-globals.ballRadius){
    y = globals.div - globals.ballRadius;
    ball.dy = -ball.dy; 
    ball.dx += 20;
  }

  //check top boundary
  else if(ball.nextY < globals.ballRadius){
    y = globals.ballRadius;
    ball.dy = -ball.dy;
    ball.dx += 20;
  }
  
  // non edge cases
  else{
    ball.x += ball.dx;
    ball.y += ball.dy;  
  }

  state.ball.x = ball.x;
  state.ball.y = ball.y;
  globals.dx = ball.dx;
  globals.dy = ball.dy;
}

// send out 60 times/sec the state to the 2 players
setInterval(function() {
  if(state.mode){
    if(state.ball.paused == 0)
      updateBall();	
    state['players']= players; 
    io.sockets.emit('state', state);
  }
}, 1000 / 60);