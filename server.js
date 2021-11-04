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
var bounceCnt = 0;
var globals = { div: 20000,                          // virtual grid size
                dx: -80, dy: 0,                      // arbitrary step size for ball movement
                ballRadius: 200,                     // virtual ball radius (will be translated in canvas.js)
                block: {width:400, height:3000}};    // virtual block size (will be translated in canvas.js)

var colorSets = [
  {fg:"white", bg:"black"},
  {fg:"black", bg:"white"}
  /* {fg:"white", bg:"black"},
  {fg:"white", bg:"black"},
  {fg:"white", bg:"black"}, */
];

var state = {ball :{x:globals.div/2, 
                    y:globals.div/2,
                    dx:globals.dx,
                    dy:globals.dy,
                    paused:0},
             players:{},
             left: 0,
             right: 0,
             colors: colorSets[0],
             mode :0 }; // 0: menu, 1:single(left), 2:single (right), 3:multiplayer

io.on('connection', function(socket) 
{	

  let socketId = socket.id;
  socket.on('new player', function() 
  { 
    console.log("player entered: ");
    pauseGame();
    
    // first player to enter
    if(Object.keys(state.players).length == 0){
      console.log("creating left player");
      state.left = socketId;
      state.players[socketId] = { y:0, score:0, playing:0, side:"left"};
      state.mode = 0;	
    }

    // second player to enter
    else if(Object.keys(state.players).length == 1){
      console.log("creating right player");
      state.right = socketId;
      state.players[socketId] = { y:0, score:0, playing:0, side:"right"};	
    }

    console.log({state});
    for(i in state.players)
      console.log(state.players[i]);
    io.sockets.emit('state', state);
    // else spectators? 
  });
  
  socket.on('disconnect', function() {
    console.log("player left" );
    delete state.players[socketId];
    if(socketId == state.left)
      state.left = 0;
    else if (socketId == state.right)
      state.right = 0;
    pauseGame();
    io.sockets.emit('state', state);

  });
  
  socket.on('state', function(data) {
    if(Object.keys(state.players).length){
      state.players[socketId].y = data.y;
      state.players[socketId].playing = data.playing;
    }
    
/*     console.log("mode = "+state.mode);
    console.log("num of players: "+Object.keys(state.players).length);
 */
    switch(Object.keys(state.players).length){
      case 0:
        state.mode = 0;
        break;
      case 1:
        if(state.players[socketId].side == "left" && state.players[socketId].playing)
          state.mode = 1;
        else if(state.players[socketId].side == "right" && 
                state.players[socketId].playing)
          state.mode = 2;
        else
          state.mode = 0;
        break;
      case 2:
        if(state.players[state.left].playing && state.players[state.right].playing)
          state.mode = 3;
        else
          state.mode = 0;
        break;
    }
  });
});

// used after a player scores
function pauseBall(){
  state.ball.paused=1;
  setTimeout(function(){
    state.ball.paused = 0;
  },1500)
}

function pauseGame(){
  state.mode = 0;
  for(p in state.players)
    state.players[p].playing = 0;
}

function leftHit(_ball){ 
  if(state.mode==2){ // single player (right)
    stepUp = _ball.dx>0 ? 20 : -20;
    _ball.dx = -(_ball.dx+stepUp); 
    _ball.x = globals.ballRadius;
    changeColor();
    return 0;
  }

  hitLength = globals.block.height/2 + globals.ballRadius;
  if( state.players[state.left].y - hitLength <_ball.y && 
      _ball.y<state.players[state.left].y + hitLength ){
    stepUp = _ball.dx>0 ? 20 : -20;
    _ball.dx = -(_ball.dx+stepUp); 
    _ball.x = globals.block.width + globals.ballRadius;

    relativeY = _ball.y - state.players[state.left].y ;
    _ball.dy = _ball.dy + relativeY/15;
    changeColor();
  }
  else{
    _ball.x=globals.div/2; 
    _ball.y=globals.div/2;
    _ball.dy = 0;
    _ball.dx = -100;
    if(state.mode==3)
      state.players[state.right].score++;
    pauseBall();
  }
}

function rightHit(_ball){
  if(state.mode==1){ //single player (left)
    stepUp = _ball.dx>0 ? 20 : -20;
    _ball.dx = -(_ball.dx+stepUp); 
    _ball.x = globals.div -globals.ballRadius;
    changeColor();
    return 0;
  }

  hitLength = globals.block.height/2 + globals.ballRadius;
  if( _ball.y > state.players[state.right].y - hitLength && 
      _ball.y < state.players[state.right].y + hitLength){
    stepUp = _ball.dx>0 ? 20 : -20;
    _ball.dx = -(_ball.dx+stepUp); 
    _ball.x = globals.div-globals.ballRadius - globals.block.width;

    relativeY = _ball.y - state.players[state.right].y;
    _ball.dy = _ball.dy + relativeY/15;
    changeColor();
  }
  else{
    _ball.x=globals.div/2; 
    _ball.y=globals.div/2;
    _ball.dy = 0;
    _ball.dx = 100;
    if(state.mode==3){
      state.players[state.left].score++;
    }
    pauseBall();
  }
}

function updateBall(){
  ball = {x: state.ball.x,
          y: state.ball.y,
          dx: globals.dx,
          dy: globals.dy,
          nextX: state.ball.x + globals.dx, // new positions after step is applied
          nextY: state.ball.y + globals.dy};//
  
  if(ball.x < 1000  ){
    console.log("mode = "+ state.mode);
    console.log({ball});
  }
  /* let pause = false; */
  let lBoundary = (state.mode == 2 ) ? globals.ballRadius : (globals.block.width+globals.ballRadius);
  let rBoundary = (state.mode == 1 ) ? (globals.div-globals.ballRadius) : (globals.div-globals.block.width - globals.ballRadius) ;

  //check left boundary
  if (ball.nextX < lBoundary)
    {leftHit(ball); /* pause = true; */}

  //check right boundary
  else if (ball.nextX > rBoundary)
    rightHit(ball);

  //check bottom boundary
  else if (ball.nextY > globals.div-globals.ballRadius){
    ball.y = globals.div - globals.ballRadius;
    ball.dy = -ball.dy; 
    ball.dx += 20;
    changeColor();
  }

  //check top boundary
  else if(ball.nextY < globals.ballRadius){
    ball.y = globals.ballRadius;
    ball.dy = -ball.dy;
    ball.dx += 20;
    changeColor();
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

  /* if(pause)
    pauseBall(); */


}

function changeColor(){
  bounceCnt ++;
  state.colors = colorSets[bounceCnt%colorSets.length];
}

// send out 60 times/sec the state to the 2 players
setInterval(function() {
  if(state.mode){
    if(state.ball.paused == 0)
      updateBall();
    io.sockets.emit('state', state);
  }
}, 1000 / 60);