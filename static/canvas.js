var socket = io();

var WIDTH = window.innerWidth -20;
var HEIGHT = window.innerHeight -20;
var dx = -5; var dy = 1;

// the canvas for the game
var gameArea = {
	canvas : document.createElement("canvas"),
	initialize : function(){
		this.backgroundColor = 000000;
		this.canvas.width = WIDTH;
		this.canvas.height = HEIGHT;
		this.context = this.canvas.getContext("2d");
		document.body.insertBefore(this.canvas, document.body.childNodes[0]);
	},
	clear: function(){
		this.context.clearRect(0,0, this.canvas.width, this.canvas.height);
	}
}

function startGame(){
	gameArea.initialize();
}

function player( x, y){
	this.width = 30;
	this.height = Math.round(HEIGHT/10);
	this.x = x;
	this.y = y;
	
	this.update = function(){
		ctx = gameArea.context;
		ctx.fillStyle = "lime";
		if(this.y < 0)
			{this.y = 0;}
		else if(this.y > gameArea.canvas.height - 90) 
			{this.y = gameArea.canvas.height - 90;}
		ctx.fillRect(this.x, this.y, this.width, this.height);
	}
}

function ball(x, y){
	this.x = x;
	this.y = y;
	
	this.draw = function(){
		ctx = gameArea.context;
		ctx.fillStyle = "lime";
		
		ctx.beginPath();
		ctx.arc(this.x,this.y,20,0,2*Math.PI);
		ctx.stroke();
		ctx.fill();
	}
}
 
function drawScore(score){
	ctx = gameArea.context;
	ctx.font = "500px Helvetica";
	ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
	ctx.fillText(score[0], WIDTH/5, 3*HEIGHT/4);
	if(score.length > 1)
		ctx.fillText(score[1], WIDTH-2*WIDTH/5, 3*HEIGHT/4);
}

//capture mouse movement and send position to server
var movement;
document.addEventListener('mousemove', function(event){
	movement = Math.round((event.clientY)/HEIGHT*1000)-10;
});


// send monitor info to server for each user
var monitorSize = {x : WIDTH, y : HEIGHT};
socket.emit('new player', monitorSize);

// send player info to server 60 times/sec
setInterval(function() {
  socket.emit('movement', movement);
}, 1000 / 60);

// when the user receives the latest state of the game,
// clear the window and draw updated state
socket.on('state', function(state) {
	gameArea.clear();

	// get ball position and draw
	var x = (WIDTH)*(state.ball.x/1000);
	var y = HEIGHT*state.ball.y/1000;
	var gameBall = new ball(x,y);
	gameBall.draw();	
	
	// draw players
	var users = [], score=[];
	var i=0;
	for (var id in state.players){
		var temp = state.players[id];
		users.push(new player(i*(WIDTH-30), HEIGHT*temp.y/1000)) ;
		users[i].update();
		score.push(temp.score)
		i++;
	}

	//draw score
	drawScore(score);
});	 
