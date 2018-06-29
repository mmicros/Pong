var socket = io();

var WIDTH = window.innerWidth -200;
var HEIGHT = window.innerHeight -100;
var dx = -5; var dy = 1;

var gameArea = {
	canvas : document.createElement("canvas"),
	initialize : function(){
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
	this.height = 90;
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
	
	this.update = function(){
		if (this.x + dx > WIDTH - 20 || this.hit() )
		dx = -dx;
		if (this.y + dy > HEIGHT -120 || this.y + dy < 20)
		dy = -dy;

		this.x += dx;
		this.y += dy;
		
		if(this.x < 0){ this.x=WIDTH/2; this.y=HEIGHT/2}
		
		var message = "x = " + this.x ;
		document.getElementById("x").innerHTML = message;
		this.draw(this.x, this.y);
	}
	
	this.hit = function(){
	  
	  for (var i=0; i<users.length; i++){
		//console.log( + "player " + users[0].y);
		/* if(this.x + dx < 51 && i==0){
		  if (this.y > p.y ){
			if( this.y < p.y + 20 ){dy += 3; dx -= 0.1; return true;}
			if( this.y < p.y + 45 ){dy += 1; dx -= 0.1; return true;}
			if( this.y < p.y + 70 ){dy -= 1; dx -= 0.1; return true;}
			if( this.y < p.y + 90 ){dy -= 3; dx -= 0.1; return true;}
		  }
		} */
	  }	
	  return false;
	}

}

//capture mouse movement and send position to server
var movement;
document.addEventListener('mousemove', function(event){
	movement = event.clientY-45;
});

socket.emit('new player');

setInterval(function() {
  socket.emit('movement', movement);
}, 1000 / 60);

socket.on('state', function(state) {
  	gameArea.clear();
	// get ball position and draw
	var x = (WIDTH)*(state.ball.x/1000);
	var y = HEIGHT*state.ball.y/1000;
	console.log(x/1000 + " , "+y/1000);
	var gameBall = new ball(x,y);
	gameBall.draw();	
	var users = [];
	
	var i=0;
	for (var id in state.players){
		var temp = state.players[id];
		users.push(new player(i*(WIDTH-200), temp.y)) ;
		users[i].update();
		i++;
	}
});	 
