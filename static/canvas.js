var socket = io();

var globals = {div: 20000,                        // virtual grid size
			   ballRadius: 200,                   // virtual ball radius (will be translated in canvas.js)
			   block: {width:400, height:3000}};  // virtual block size (will be translated in canvas.js)
var gameCanvas = document.createElement("canvas");
var context = gameCanvas.getContext("2d");
var WIDTH = window.innerWidth-10;
var HEIGHT = window.innerHeight-10;
var colors = {};

// the canvas for the game
var gameArea = {
	canvas : gameCanvas,
	initialize : function(){
		this.canvas.width = WIDTH;
		this.canvas.height = HEIGHT;
		this.canvas.margin = 0;
		this.context = context;
		document.body.insertBefore(this.canvas, document.body.childNodes[0]);
	},
	clear: function(){
		context.clearRect(0,0, WIDTH, HEIGHT);
	},
	getReady: function(){
		if(playerState.playing){
			ctx = context;
			ctx.textAlign = "center";
			ctx.fillStyle = colors.fg
			ctx.font = "50px Russo One";
			ctx.fillText("MIKE'S PONG GAME", WIDTH/2, HEIGHT/5);
			
			ctx.font = "20px Russo One";
			ctx.fillText("WAITING ON THE OTHER PLAYER", WIDTH/2, HEIGHT*0.4);
		}
		else{
			ctx = context;
			ctx.textAlign = "center";
			ctx.fillStyle = colors.fg
			ctx.font = "50px Russo One";
			ctx.fillText("MIKE'S PONG GAME", WIDTH/2, HEIGHT/5);
			
			ctx.font = "20px Russo One";
			ctx.fillText("CLICK [SPACE] TO BEGIN", WIDTH/2, HEIGHT*0.4);
			playerState.playing = 0;	
		}
	}
}

function startGame(){
	gameArea.initialize();
}

function player(side, y){
	this.translatedBlockHeight = HEIGHT*globals.block.height/globals.div;
	this.translatedBlockWidth = WIDTH*globals.block.width/globals.div;
	if(side == "left")
		this.x = 0;
	if(side=="right")
	  this.x=WIDTH-this.translatedBlockWidth;
	playerState.side = side;
	this.screenPos = {x: this.x, y: y}; // server coordinates
	/* this.translatedBlockHeight = HEIGHT*globals.block.height/globals.div;
	this.translatedBlockWidth = WIDTH*globals.block.width/globals.div; */
	this.update = function(){
		ctx = gameArea.context;
		ctx.fillStyle = colors.fg;
		if(this.screenPos.y < this.translatedBlockHeight/2)
			{this.screenPos.y = this.translatedBlockHeight/2;}
		else if(this.screenPos.y > HEIGHT-this.translatedBlockHeight/2) 
			{this.screenPos.y = HEIGHT - this.translatedBlockHeight/2;}
		ctx.fillRect(this.screenPos.x, this.screenPos.y-this.translatedBlockHeight/2, this.translatedBlockWidth, this.translatedBlockHeight);
	}
}

function ball(x, y){
	this.virtualPos = {x: x, y: y}; // server coordinates
	this.translatedPos = {x: x*WIDTH/globals.div , y: y*HEIGHT/globals.div};
	this.radius = globals.ballRadius*WIDTH/globals.div;
	this.draw = function(){
		let correction = 0;
		if(y==200)
			correction = this.radius - globals.ballRadius*HEIGHT/globals.div;
		else if (y == globals.div - globals.ballRadius)
			correctedY = 	this.correction = globals.ballRadius*HEIGHT/globals.div - this.radius;

		ctx = gameArea.context;
		ctx.fillStyle = colors.fg;
		ctx.beginPath();
		ctx.arc(this.translatedPos.x ,this.translatedPos.y + correction, this.radius ,0 ,2*Math.PI);
		ctx.stroke();
		ctx.fill();

	}
}
 
function drawScore(score){
	ctx = gameArea.context;
	ctx.textAlign = "center";
	ctx.font = "100px Russo One";
	ctx.fillStyle = colors.fg;
	if(score.length > 1){
		ctx.fillText(score[0], WIDTH/4, 8/10*HEIGHT);
		ctx.fillText(score[1], 3/4*WIDTH, 8/10*HEIGHT);
	}
}

// the player state consists of the mode the game(and by extension
// the player) is in, and his mouse y-coordinate.
var playerState = {};
playerState.playing = 0;

document.addEventListener('keydown', function(event){
	console.log("key press: " + event.which);
	key = event.which;
	if(key == 38)
		playerState.y -= 1500;
	else if(key == 40)
		playerState.y += 1500;
	else if(key == 32)
		playerState.playing = 1;
},true);

gameCanvas.addEventListener('mousemove', function(event){
	//console.log("mouse : %i, %i", event.clientX, event.clientY);
	playerState.y = Math.round(event.clientY/(HEIGHT)*globals.div);
});

// notify server about new player entering
socket.emit('new player');

// send player info to server 60 times/sec
setInterval(function() {
  socket.emit('state', playerState);
}, 1000 / 60);

// when the user receives the latest state of the game,
// clear the window and draw updated state
socket.on('state', function(state) {
	gameArea.clear();
	//console.log({state});
	
	colors = state.colors;
	gameCanvas.style.background = colors.bg;
	if(state.mode==0){
		gameArea.getReady();
		return;
	}

	// get ball position and draw
	var gameBall = new ball(state.ball.x,state.ball.y);
	gameBall.draw();	
	
	// draw players
	var users = {}, score=[];
	for (p in state.players){
		users[state.players[p].side] = new player(state.players[p].side, HEIGHT*state.players[p].y/globals.div) ;
		users[state.players[p].side].update();
		score.push(state.players[p].score);
	}

	//draw score
	drawScore(score);
});	 