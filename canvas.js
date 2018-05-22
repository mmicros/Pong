function startGame(){
	gameArea.initialize();
	leftPlayer = new component(30, 90, 0, 0); 
}

var gameArea = {
	canvas : document.createElement("canvas"),
	initialize : function(){
		this.canvas.width = window.innerWidth-100;
		this.canvas.height = window.innerHeight-100;
		this.context = this.canvas.getContext("2d");
		document.body.insertBefore(this.canvas, document.body.childNodes[0]);
	}
}

function component(w, h, x, y){
	this.width = w;
	this.height = h;
	this.x = x;
	this.y = y;
	ctx = gameArea.context;
	ctx.fillStyle = "lime";
	ctx.fillRect(this.x, this.y, this.width, this.height);
}

