if(broadcast ==true){
	var w = window.innerWidth;
	var h = window.innerHeight;

	var players = [];
	var ghosts = [];
	var mapScale,
		pillSize,
		pillSizeFactor,
		animationTimer,
		animationTimerFactor,
		oldTime,
		currentTime,
		startTime,
		gameOn;

	//For debuging:--------

	var direction = 4;

	function mouseClicked(){
		var win = window.open("/controller?id=" + gameid)
		win.focus();
	}

	var posX = 10,
		posY = 10;
	//--------------


	function responsiveMap(mapW,mapH){
		var relationW = w/mapW;
		var relationH = h/mapH;
		if(relationW > relationH){
			return relationH;
		} else {
			return relationW;
		}
	}

	function setup() {

		gameOn = false;
		oldTime = 0;
		mapScale = responsiveMap(usedMap.length,usedMap[0].length)
		pillSize = 4; 
		pillSizeFactor = 0.5;
		animationTimer = 0;
		animationTimerFactor = 0.25;
		createCanvas(usedMap.length*mapScale,usedMap[0].length*mapScale);
		background('#0000FF');

		drawMain(usedMap,mapScale);
		startTime = 0;
	}


	function draw(){
		/*currentTime = millis();
		if(currentTime-oldTime > 50){
			if(!gameOn){
				startTime = millis();
			}
			if(5000>startTime) {
				drawMain(usedMap,mapScale);
				textSize(32);
				strokeWeight(1);
				fill('#FFFF00');
				textAlign(CENTER);
				textStyle(BOLD);
				text("Willkommen bei Pacmany!\nEs geht los in:\n"+(30-Math.floor(startTime/1000)),usedMap.length/2*mapScale,usedMap[0].length/2*mapScale);
			} else {
				gameOn = true;
				socket.emit("updateRequest");
			}
			oldTime = currentTime;
		}
	*/
		
	}


	function keyPressed(){
		//console.log(keyCode)
		if(keyCode == 38){
			direction = 0;
		} else if(keyCode == 39){
			direction = 1;
		} else if(keyCode == 40){
			direction = 2;
		} else if(keyCode == 37){
			direction = 3;
		}
		
	}

	function drawFood(x,y,mapScale){
		fill(255);
		strokeWeight(0);
		rect((x+0.5)*mapScale,(y+0.5)*mapScale,mapScale/8,mapScale/8)
	}

	function drawPills(x,y,mapScale, size){
		fill(255);
		ellipseMode(CENTER);
		strokeWeight(0);
		ellipse((x+0.5)*mapScale,(y+0.5)*mapScale,mapScale/pillSize,mapScale/pillSize)
	}

	function drawMain(usedMap,mapScale){

			background('#0000FF');


			if(animationTimer <0){
				animationTimerFactor = -1*animationTimerFactor;
			} else if (animationTimer > 1){
				animationTimerFactor = -1*animationTimerFactor
			}

			if(pillSize > 6){
				pillSizeFactor = -1*pillSizeFactor;
			} else if (pillSize < 2){
				pillSizeFactor = -1*pillSizeFactor
			}

			pillSize+=pillSizeFactor;
			animationTimer+=animationTimerFactor;

			

		for (i = 0; i < usedMap.length;i++) {
			for(j=0; j < usedMap[i].length;j++ ){
				fill(0)
				strokeWeight(10);
				if(usedMap[i][j] == 1){
					rect(i*mapScale,j*mapScale,mapScale,mapScale);
					drawFood(i,j, mapScale);
				} else if ( usedMap[i][j] == 2 || usedMap[i][j] == 3) {
					rect(i*mapScale,j*mapScale,mapScale,mapScale);
				}else if (usedMap[i][j] == 4){
					rect(i*mapScale,j*mapScale,mapScale,mapScale);
					drawPills(i,j,mapScale, pillSize);
				}
			}
		}
		for (i=0;i<players.length;i++){
			drawPacman(usedMap,mapScale,players[i].oldDirection,players[i].posX,players[i].posY,animationTimer);
		}
		for(i=0;i<ghosts.length;i++){
			drawGhost(usedMap,mapScale,ghosts[i].color,ghosts[i].direction,ghosts[i].posX,ghosts[i].posY,animationTimer);
		}
	}


	function drawPacman(usedMap,mapScale,direction,x,y,animationTimer){
		fill('#FFFF00');
		ellipseMode(CORNER);
		strokeWeight(1)
		ellipse(x*mapScale,y*mapScale,mapScale,mapScale);
		fill(0);
		strokeWeight(0);
		if(direction == 0)
		{
			triangle((x+0.4*animationTimer)*mapScale,y*mapScale,(x+0.5)*mapScale,(y+0.5)*mapScale,(x+1-0.4*animationTimer)*mapScale,(y)*mapScale);
			ellipseMode(CENTER);
			ellipse((x+0.25)*mapScale,(y+0.5)*mapScale,mapScale/4,mapScale/4);
		}
		 else if (direction == 1) 
		{
			triangle((x+1)*mapScale,(y+0.4*animationTimer)*mapScale,(x+0.5)*mapScale,(y+0.5)*mapScale,(x+1)*mapScale,(y+1-0.4*animationTimer)*mapScale);
			ellipseMode(CENTER);
			ellipse((x+0.5)*mapScale,(y+0.25)*mapScale,mapScale/4,mapScale/4);
		}
		 else if (direction == 2) 
		 {
			triangle((x+0.4*animationTimer)*mapScale,(y+1)*mapScale,(x+0.5)*mapScale,(y+0.5)*mapScale,(x+1-0.4*animationTimer)*mapScale,(y+1)*mapScale);
			ellipseMode(CENTER);
			ellipse((x+0.25)*mapScale,(y+0.5)*mapScale,mapScale/4,mapScale/4);
		}
		 else if (direction == 3) 
		 {
			triangle(x*mapScale,(y+0.4*animationTimer)*mapScale,(x+0.5)*mapScale,(y+0.5)*mapScale,x*mapScale,(y+1-0.4*animationTimer)*mapScale);
			ellipseMode(CENTER);
			ellipse((x+0.5)*mapScale,(y+0.25)*mapScale,mapScale/4,mapScale/4);
		}
	}

	function drawGhost(usedMap,mapScale,color,direction,x,y,animationTimer){
		fill(color);
		ellipseMode(CORNER);
		stroke(color);
		strokeWeight(2);
		//ellipse(x*mapScale,y*mapScale,mapScale,mapScale*1.1);
		arc(x*mapScale, y*mapScale, mapScale, mapScale*1.1, PI, 0)
		drawGhostLegs(usedMap,mapScale,color,direction,x,y,animationTimer);
		stroke(0);
		strokeWeight(0);
		//fill(0);
		//rect(x*mapScale,(y+0.6)*mapScale,mapScale,mapScale*1.1/2);
		fill(255);
		ellipseMode(CENTER);
		ellipse((x+0.3)*mapScale,(y+0.3)*mapScale,mapScale/4,mapScale/4);
		ellipse((x+0.7)*mapScale,(y+0.3)*mapScale,mapScale/4,mapScale/4);

		fill(0);
		if(direction == 0)
			{
				ellipse((x+0.3)*mapScale,(y+0.25)*mapScale,mapScale/8,mapScale/8);
				ellipse((x+0.7)*mapScale,(y+0.25)*mapScale,mapScale/8,mapScale/8);
			}
		 else if (direction == 1) 
			{
				ellipse((x+0.35)*mapScale,(y+0.3)*mapScale,mapScale/8,mapScale/8);
				ellipse((x+0.75)*mapScale,(y+0.3)*mapScale,mapScale/8,mapScale/8);
			}
		 else if (direction == 2) 
			{
				ellipse((x+0.3)*mapScale,(y+0.35)*mapScale,mapScale/8,mapScale/8);
				ellipse((x+0.7)*mapScale,(y+0.35)*mapScale,mapScale/8,mapScale/8);
			}
		 else if (direction == 3) 
			{
				ellipse((x+0.25)*mapScale,(y+0.3)*mapScale,mapScale/8,mapScale/8);
				ellipse((x+0.65)*mapScale,(y+0.3)*mapScale,mapScale/8,mapScale/8);
			}
		
	}



	function drawGhostLegs(usedMap,mapScale,color,direction,x,y,animationTimer) {
		fill(color);
		strokeWeight(0);
		arc((x+0.25*animationTimer)*mapScale,(y+0.3)*mapScale, mapScale/4, mapScale/2, 0, PI);

		arc((x+0.25-0.25*animationTimer)*mapScale,(y+0.3)*mapScale, mapScale/4, mapScale/2, 0, PI);
		
		arc((x+0.5+0.25*animationTimer)*mapScale,(y+0.3)*mapScale, mapScale/4, mapScale/2, 0, PI);
		
		arc((x+0.75-0.25*animationTimer)*mapScale,(y+0.3)*mapScale, mapScale/4, mapScale/2, 0, PI);
		

	}


	function windowResized() {
		w = window.innerWidth;
	  	h = window.innerHeight;
	  	mapScale = responsiveMap(usedMap.length,usedMap[0].length);
	  	resizeCanvas(usedMap.length*mapScale,usedMap[0].length*mapScale);
	  	drawMain(usedMap,mapScale);
	}
}