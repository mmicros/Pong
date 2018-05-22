function startGame(){
	gameArea.initialize();
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

