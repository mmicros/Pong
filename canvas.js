function startGame(){
	gameBall = ball(window.innerWidth/2, window.innerHeight/2);
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
 
function ball(x, y){
	this.x = x;
	this.y = y;
	
	ctx = gameArea.context;
	//ctx.fillStyle = "lime";
	
	//ctx.beginPath();
	//ctx.arc(this.x,this.y,50,0,2*Math.PI);
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

function updateGameArea(){
	gameArea.clear();
	leftPlayer.update();
    rightPlayer.update();	
}

