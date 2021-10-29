var socket = io();

var globals = {div: 20000,                        // virtual grid size
			   ballRadius: 500,                   // virtual ball radius (will be translated in canvas.js)
			   block: {width:400, height:3000}};  // virtual block size (will be translated in canvas.js)
var gameCanvas = document.createElement("canvas");
var context = gameCanvas.getContext("2d");
var WIDTH = window.innerWidth-10;
var HEIGHT = window.innerHeight-10;

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
	singlePlayer: function(){
		ctx = context;
		ctx.textAlign = "center";
		ctx.font = "50px Russo One";
		ctx.fillText("MIKE'S EXISTENTIAL PONG", WIDTH/2, HEIGHT/5);
		
		ctx.font = "20px Russo One";
		ctx.fillText("It seems you are the only player. You didn't ask for it,", WIDTH/2, HEIGHT*0.4);
		ctx.fillText("but you must play in Sisyphus mode", WIDTH/2, HEIGHT*0.5);
		
		var timer = setTimeout(function(){
			playerState.mode=1;
		}, 5000)
	},
	multiPlayer: function(){
		ctx = context;
		ctx.font = "50px Russo One";
		ctx.textAlign = "center"
		ctx.fillText("MIKE'S EXISTENTIAL PONG", this.canvas.width/2, this.canvas.height/5);

		ctx.font = "20px Russo One";
		ctx.fillText("It seems there are  2 players now. Hades does not", this.canvas.width/2, this.canvas.height*0.4);
		ctx.fillText("discriminate lol. Play your meaningless game", this.canvas.width/2, this.canvas.height*0.6);
		
		var timer = setTimeout(function(){
			playerState.mode=2;
		}, 5000)
	}

}

function startGame(){
	console.log("canvas.js: Entered startGame()");
	gameArea.initialize();
	var rect=gameCanvas.getBoundingClientRect();
	console.log("screen = %i,%i",WIDTH, HEIGHT);

}

function player(x, y){
	this.screenPos = {x: x, y: y}; // server coordinates
	this.translatedBlockHeight = HEIGHT*globals.block.height/globals.div;
	this.translatedBlockWidth = WIDTH*globals.block.width/globals.div;
	this.update = function(){
		ctx = gameArea.context;
		ctx.fillStyle = "red";
		if(this.screenPos.y < this.translatedBlockHeight/2)
			{this.screenPos.y = this.translatedBlockHeight/2;}
		else if(this.screenPos.y > HEIGHT-this.translatedBlockHeight/2) 
			{this.screenPos.y = HEIGHT - this.translatedBlockHeight/2;}
		
		//xx = (this.screenPos.x==0 ? this.translatedBlockWidth : WIDTH-4*this.translatedBlockWidth);
		ctx.fillRect(this.screenPos.x, this.screenPos.y-this.translatedBlockHeight/2, this.translatedBlockWidth, this.translatedBlockHeight);
	}
}

function ball(x, y){
	this.virtualPos = {x: x, y: y}; // server coordinates
	this.translatedPos = {x: x*WIDTH/globals.div , y: y*HEIGHT/globals.div};
	this.radius = globals.ballRadius*HEIGHT/globals.div;
	
	this.draw = function(){
		ctx = gameArea.context;
		ctx.fillStyle = "black";
		ctx.beginPath();
		ctx.arc(this.translatedPos.x ,this.translatedPos.y , this.radius ,0 ,2*Math.PI);
		ctx.stroke();
		ctx.fill();
	}
}
 
function drawScore(score){
	//console.log("canvas.js: Entered drawScore()");
	ctx = gameArea.context;
	ctx.textAlign = "center";
	ctx.font = "100px Russo One";
	ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
	if(score.length > 1){
		ctx.fillText(score[0], WIDTH/4, 8/10*HEIGHT);
		ctx.fillText(score[1], 3/4*WIDTH, 8/10*HEIGHT);
	}
}

// the player state consists of the mode the game(and by extension
// the player) is in, and his mouse y-coordinate.
var playerState = {};
playerState.mode = 0;
gameCanvas.addEventListener('mousemove', function(event){
	//console.log("mouse : %i, %i", event.clientX, event.clientY);
	var rect=gameCanvas.getBoundingClientRect();
	playerState.y = Math.round(event.clientY/(HEIGHT)*globals.div);
});

// notify server about new player entering
console.log("new player width = %i", WIDTH);
socket.emit('new player');

// send player info to server 60 times/sec
setInterval(function() {
  socket.emit('state', playerState);
}, 1000 / 60);

// when the user receives the latest state of the game,
// clear the window and draw updated state
socket.on('state', function(state) {
	gameArea.clear();

	if(state.mode==0){
		if(Object.keys(state.players).length == 2)
			gameArea.multiPlayer();
		else
			gameArea.singlePlayer();
		return;
	}

	// get ball position and draw
	var gameBall = new ball(state.ball.x,state.ball.y);
	gameBall.draw();	
	
	// draw players
	var users = [], score=[];
	var i=0;
	for (var id in state.players){
		var temp = state.players[id];
		users.push(new player(i*(WIDTH-30), HEIGHT*temp.y/globals.div)) ;
		users[i].update();
		score.push(temp.score)
		i++;
	}

	//draw score
	drawScore(score);
});	 
