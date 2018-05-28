var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var dx = 2; var dy = 4;

function startGame(){
	gameBall = new ball(WIDTH/2, HEIGHT/2);
	leftPlayer = new player(30, 90, 0, 0); 
	rightPlayer = new player(30, 90, window.innerWidth-40, 0);
	gameArea.initialize();
}

var gameArea = {
	canvas : document.createElement("canvas"),
	initialize : function(){
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight-100;
		this.context = this.canvas.getContext("2d");
		document.body.insertBefore(this.canvas, document.body.childNodes[0]);
		this.interval = setInterval(updateGameArea,20);
	},
	clear: function(){
		this.context.clearRect(0,0, this.canvas.width, this.canvas.height);
	}
}

function getMouseY(event){
	leftPlayer.y = event.clientY-45;
}

function player(w, h, x, y){
	this.width = w;
	this.height = h;
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
	
	this.draw = function(x,y){
		ctx = gameArea.context;
		ctx.fillStyle = "lime";
		
		ctx.beginPath();
		ctx.arc(this.x,this.y,20,0,2*Math.PI);
		ctx.stroke();
		ctx.fill();
	}
	
	this.update = function(){
		if (this.x + dx > WIDTH || this.x + dx < 0)
		dx = -dx;
		if (this.y + dy > HEIGHT || this.y + dy < 0)
		dy = -dy;

		this.x += dx;
		this.y += dy;
		
		this.draw(this.x, this.y);
	}

}

function updateGameArea(){
	gameArea.clear();
	leftPlayer.update();
    rightPlayer.update();
	gameBall.update();
}

