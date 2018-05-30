var WIDTH = 1000;
var HEIGHT = window.innerHeight;
var dx = -5; var dy = 1;

function startGame(){
	gameBall = new ball(WIDTH/2, HEIGHT/2);
	leftPlayer = new player(30, 90, 0, 0); 
	//rightPlayer = new player(30, 90, window.innerWidth-40, 0);
	gameArea.initialize();
}

var gameArea = {
	canvas : document.createElement("canvas"),
	initialize : function(){
		this.canvas.width = window.WIDTH;
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
		if (this.x + dx > WIDTH - 20 || this.hit() )
		dx = -dx;
		if (this.y + dy > HEIGHT -120 || this.y + dy < 20)
		dy = -dy;

		this.x += dx;
		this.y += dy;
		
		var message = "x = " + this.x ;
		document.getElementById("x").innerHTML = message;
		this.draw(this.x, this.y);
	}
	
	this.hit = function(){
		if(this.x + dx < 51){
			if (this.y > leftPlayer.y ){
				if( this.y < leftPlayer.y + 20 ){dy += 3; dx -= 0.1; return true;}
				if( this.y < leftPlayer.y + 45 ){dy += 1; dx -= 0.1; return true;}
				if( this.y < leftPlayer.y + 70 ){dy -= 1; dx -= 0.1; return true;}
				if( this.y < leftPlayer.y + 90 ){dy -= 3; dx -= 0.1; return true;}
			}
			return false;
		}
		return false;
	}

}

function updateGameArea(){
	gameArea.clear();
	leftPlayer.update();
    //rightPlayer.update();
	gameBall.update();
}

