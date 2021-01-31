var socket = io();

var gameCanvas = document.createElement("canvas");
var context = gameCanvas.getContext("2d");
var WIDTH = window.innerWidth -50;
var HEIGHT = window.innerHeight -50;
var wCanvas = 0;
var hCanvas = 0;
var block = 0;
var div = 20000;

// the canvas for the game
var gameArea = {
	canvas : gameCanvas,
	initialize : function(){
		this.canvas.width = WIDTH;
		this.canvas.height = HEIGHT;
		this.canvas.style = "border:5px solid black;";
		this.context = context;
		document.body.insertBefore(this.canvas, document.body.childNodes[0]);
	},
	clear: function(){
		context.clearRect(0,0, this.canvas.width, this.canvas.height);
	},
	singlePlayer: function(){
		ctx = context;
		ctx.textAlign = "center";
		ctx.font = "50px Special Elite";
		ctx.fillText("MIKE'S EXISTENTIAL PONG", this.canvas.width/2, this.canvas.height/5);
		
		ctx.font = "20px Special Elite";
		ctx.fillText("It seems you are the only player. You didn't ask for it,", this.canvas.width/2, this.canvas.height*0.4);
		ctx.fillText("but you must play in Sisyphus mode", this.canvas.width/2, this.canvas.height*0.5);
		
		var timer = setTimeout(function(){
			playerState.mode=1;
		}, 5000)
	},
	multiPlayer: function(){
		/* ctx = context;
		ctx.font = "50px Special Elite";
		ctx.textAlign = "center"
		ctx.fillText("MIKE'S EXISTENTIAL PONG", this.canvas.width/2, this.canvas.height/5);

		ctx.font = "20px Special Elite";
		ctx.fillText("It seems there are  2 players now. Hades does ", this.canvas.width/2, this.canvas.height*0.4);
		ctx.fillText("discriminate lol. Play your meaningless game", this.canvas.width/2, this.canvas.height*0.6);
		 */
	}
}

function startGame(){
	gameArea.initialize();
	var rect=gameCanvas.getBoundingClientRect();
	wCanvas = rect.right - rect.left;
	hCanvas = rect.bottom - rect.top;
}

function player( x, y){
	this.width = WIDTH/40;
	this.height = Math.round(HEIGHT/7);
	this.x = x;
	this.y = y;
	
	this.update = function(){
		ctx = gameArea.context;
		ctx.fillStyle = "black";
		if(this.y < 10)
			{this.y = 0;}
		else if(this.y > gameArea.canvas.height-this.height) 
			{this.y = gameArea.canvas.height - this.height;}
		ctx.fillRect(this.x, this.y, this.width, this.height);
	}
	block = this.height;
}

function ball(x, y){
	this.x = x;
	this.y = y;
	
	this.draw = function(){
		ctx = gameArea.context;
		ctx.fillStyle = "black";
		
		ctx.beginPath();
		ctx.arc(this.x,this.y,20,0,2*Math.PI);
		ctx.stroke();
		ctx.fill();
	}
}
 
function drawScore(score){
	ctx = gameArea.context;
	/* ctx.font = "500px Helvetica";
	ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
	ctx.fillText(score[0], WIDTH/5, 3*HEIGHT/4);
	if(score.length > 1)
		ctx.fillText(score[1], WIDTH-2*WIDTH/5, 3*HEIGHT/4); */
}

// the player state consists of the mode the game(and by extension
// the player) is in, and his mouse y-coordinate.
var playerState = {};
playerState.mode = 0;
gameCanvas.addEventListener('mousemove', function(event){
	var rect=gameCanvas.getBoundingClientRect();
	playerState.height = block;
	playerState.y = Math.round((event.clientY-rect.top)/(hCanvas)*div);
});

// send monitor info to server for each user
var monitorSize = {x : wCanvas, y : hCanvas};
socket.emit('new player', monitorSize);

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
	var x = (WIDTH)*(state.ball.x/div); // the game canvas is arbitrarily divided into 1000 horizontal 
	var y = HEIGHT*state.ball.y/div;	 // and 1000 vertical segments. This helps deal with different 
	var gameBall = new ball(x,y);		 // monitor dimensions between players.
	gameBall.draw();	
	
	// draw players
	var users = [], score=[];
	var i=0;
	for (var id in state.players){
		var temp = state.players[id];
		users.push(new player(i*(WIDTH-30), HEIGHT*temp.y/div)) ;
		users[i].update();
		score.push(temp.score)
		i++;
	}

	//draw score
	drawScore(score);
});	 
