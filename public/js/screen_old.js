var w = window.innerWidth;
var h = window.innerHeight;

var players = [];
var ghosts = [];
var pills = [];
var mapScale,
	pillSize,
	pillSizeFactor,
	animationTimer,
	animationTimerFactor,
	oldTime,
	startTime;
var ghostLegToggle = false;
var score = 0;
var maxScore = 0;
var lives = 0;

//For debuging:--------

var einmal= 100;

var posX = 10,
	posY = 10;

function mouseClicked(){
	var win = window.open("/controller?gameid=" + gameid)
	win.focus();
}
//--------------

if(gameid != ""){
    socket.emit("connectScreen", {gameid: gameid, screenid:screenid}, function(response){
        if (!(response == false)){
            gamemode = response.gamemode;
            if(gamemode == "Study1.1") {
                var table = document.getElementById("score").style.display = "none";
            }
        console.log("Connected");
        } else{
        console.error("ERROR #001: Connection failed");
        }
        windowResized();
    });
    
    socket.on('disconnected', function() {
        socket.emit('disconnectScreen', {device : "screen"});
    });

    socket.on("updateScreens", function(data) {
        $( "#overlay" ).css( "visibility", "hidden" );
        players = data.players;
        ghosts = data.ghosts;
        score = data.score;
        maxScore = data.maxScore;
        lives = data.lives;
        pills = data.pills;
        
        var table = document.getElementById("score").getElementsByTagName("tbody")[0];

        var rows = table.getElementsByTagName("tr").length;
        for (i = 0; i < rows - players.length; i++){
            table.deleteRow(0);
        }
        var rows = table.getElementsByTagName("t    r").length;
        for (i = 0; i < players.length - rows; i++){
            table.insertRow(-1);
        }
                
        var i = 0
        for (player in players){
            var row = table.children[i];
            var cell1, cell2;
            if (row.children.length > 0){
                cell1 = row.children[0];
                cell2 = row.children[1];
            } else {
                cell1 = row.insertCell(0);
                cell2 = row.insertCell(1);
            }
            cell1.innerHTML = players[player].nickname;
            cell2.innerHTML = players[player].score;
            i++;
        }
        drawMain(gameMap,mapScale);
    });
    socket.on("gameCountDown", function(data){
        $( "#overlay" ).css( "visibility", "visible" );
        $( "#time" ).text(Math.floor(data.time / 1000));
    });
    socket.on("gameOver", function(){
        $( "#overlay" ).css( "visibility", "visible" );
        $( "#time" ).text("!!! Game Over !!! \n\n No more Lives left");
    });
    socket.on("gameWon", function(){
        $( "#overlay" ).css( "visibility", "visible" );
        $( "#time" ).text("!!! Game Won !!!");
    });
    socket.on("restartGame", function() {
        restart();
    });
    socket.on("updateMap", function(data){
        gameMap[data.x][data.y] = data.value;
    });
    
    socket.on("resetMap", function(data) {
        gameMap  = jQuery.extend(true, [], mapOriginal);
        resetDraw();
    });
    
    socket.on("toIdle", function(data) {
        $( "#overlay" ).css( "visibility", "hidden" );
    });
}

$(document).ready(function() {
    new QRCode(document.getElementById("qrcode"), "http://pacmany.hcilab.org:" + port + "/controller?gameid="+ gameid);
    
    if (noqrcode){
        $( "#qrcode" ).css( "visibility", "hidden" );
        $( "#qrcode" ).css( "width", "0px" );
    }
});



function responsiveMap(mapW, mapH){
	var relationW = w / mapW;
	var relationH = h / mapH;
	if(relationW > relationH){
		return relationH;
	} else {
		return relationW;
	}
}

function preload() {
	if(!gameMap){
		data = socket.emit("getMapData",gameid,function(response){
			gameMap = response.gameMap;
			windowResized();
		})
	}
}

function setup() {
	frameRate(30);
	doDraw = true;
	isInit = false;
	oldTime = 0;
	mapScale = responsiveMap(gameMap.length,gameMap[0].length)
	pillSize = 4; 
	pillSizeFactor = 0.5;
	animationTimer = 0;
	animationTimerFactor = 0.25;
    einmal = 00;
	createCanvas(gameMap.length*mapScale,gameMap[0].length*mapScale);
	fill('#0000FF');
    noStroke();
    rect(0,0,window.innerWidth,window.innerHeight);
	startTime = 0;
    noLoop();
    resetDraw();
}

function resetDraw(){
    drawInitMap();
	drawMain();
}

function drawInitMap (){
    fill('#0000FF');
    background('#0000FF')
    for (i = 0; i < gameMap.length;i++) {
        for(j=0; j < gameMap[i].length;j++ ){
            fill(0)
            strokeWeight(5);
            stroke(0);
            if(gameMap[i][j] == 1){
                rect(i*mapScale,j*mapScale,mapScale,mapScale);
                drawFood(i,j, mapScale);
            } else if ( gameMap[i][j] == 2 || gameMap[i][j] == 3 ||  gameMap[i][j] == 3) {
                rect(i*mapScale,j*mapScale,mapScale,mapScale);
            }
        }
    }  
}

function drawMain(){

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
    for (i=0;i<players.length;i++){
        for(n = -1; n<2; n++){
            for(m = -1; m<2; m++){
                fill(0)
                strokeWeight(5);
                stroke(0);
                if(gameMap[Math.floor(players[i].posX+n)][Math.floor(players[i].posY+m)] == 1){
                rect(Math.floor(players[i].posX+n)*mapScale,Math.floor(players[i].posY+m)*mapScale,mapScale,mapScale);
                drawFood(Math.floor(players[i].posX+n),Math.floor(players[i].posY+m), mapScale);
            } else if ( gameMap[Math.floor(players[i].posX+n)][Math.floor(players[i].posY+m)] == 2 || gameMap[Math.floor(players[i].posX+n)][Math.floor(players[i].posY+m)] == 3) {
                rect(Math.floor(players[i].posX+n)*mapScale,Math.floor(players[i].posY+m)*mapScale,mapScale,mapScale);
            }
            }
        }
    }
    for(i=0;i<ghosts.length;i++){
        for(n = -1; n<2; n++){
            for(m = -1; m<2; m++){
                fill(0)
                strokeWeight(5);
                stroke(0);
                if(gameMap[Math.floor(ghosts[i].posX+n)][Math.floor(ghosts[i].posY+m)] == 1){
                rect(Math.floor(ghosts[i].posX+n)*mapScale,Math.floor(ghosts[i].posY+m)*mapScale,mapScale,mapScale);
                drawFood(Math.floor(ghosts[i].posX+n),Math.floor(ghosts[i].posY+m), mapScale);
            } else if ( gameMap[Math.floor(ghosts[i].posX+n)][Math.floor(ghosts[i].posY+m)] == 2 || gameMap[Math.floor(ghosts[i].posX+n)][Math.floor(ghosts[i].posY+m)] == 3) {
                rect(Math.floor(ghosts[i].posX+n)*mapScale,Math.floor(ghosts[i].posY+m)*mapScale,mapScale,mapScale);
            }
            }
        }
    }

	
	for (i=0;i<players.length;i++){
		drawPacman(gameMap,mapScale,players[i].direction,players[i].posX,players[i].posY,players[i].color,animationTimer,players[i].pillActive);
	}
    for (i=0;i<pills.length;i++){
        if(pills[i].ready == true)
            drawPills(pills[i].position.x,pills[i].position.y,mapScale, pillSize,pills[i].color);
    }
	for(i=0;i<ghosts.length;i++){
		drawGhost(gameMap,mapScale,ghosts[i].color,ghosts[i].direction,ghosts[i].posX,ghosts[i].posY,animationTimer);
	}
    if (ghostLegToggle) {
        ghostLegToggle = false;
    } else {
        ghostLegToggle = true;
    }
    
    fill('#0000FF');
	stroke('#0000FF');
    rect(0,0,gameMap.length*mapScale,0.8*mapScale);
    
	textSize(1*mapScale);
	strokeWeight(1);
	fill('#FFFF00');
	stroke('#FFFF00');
	textAlign(LEFT);
	textStyle(BOLD);
    if(gamemode != "Study1.2") {
	   text("Score: "+score+"/"+maxScore,0.75*mapScale,0.75*mapScale);
    }
	textAlign(RIGHT);
	text("Lives: "+lives,(gameMap.length-0.75)*mapScale,0.75*mapScale);
}

function drawFood(x,y,mapScale){
	fill(255);
	strokeWeight(0);
	rect((x+0.5)*mapScale,(y+0.5)*mapScale,mapScale/8,mapScale/8)
}

function drawPills(x,y,mapScale, size, color){
	fill(0);
    strokeWeight(5);
    stroke(0);
    rect(x*mapScale,y*mapScale,mapScale,mapScale);
    fill(color);
	ellipseMode(CENTER);
	strokeWeight(0);
	ellipse((x+0.5)*mapScale,(y+0.5)*mapScale,mapScale/pillSize,mapScale/pillSize)
}

function drawPacman(gameMap,mapScale,direction,x,y,color,animationTimer,pillActive){
	fill(color);
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
	} else if (direction == 1) {
		triangle((x+1)*mapScale,(y+0.4*animationTimer)*mapScale,(x+0.5)*mapScale,(y+0.5)*mapScale,(x+1)*mapScale,(y+1-0.4*animationTimer)*mapScale);
		ellipseMode(CENTER);
		ellipse((x+0.5)*mapScale,(y+0.25)*mapScale,mapScale/4,mapScale/4);
	} else if (direction == 2) {
		triangle((x+0.4*animationTimer)*mapScale,(y+1)*mapScale,(x+0.5)*mapScale,(y+0.5)*mapScale,(x+1-0.4*animationTimer)*mapScale,(y+1)*mapScale);
		ellipseMode(CENTER);
		ellipse((x+0.25)*mapScale,(y+0.5)*mapScale,mapScale/4,mapScale/4);
	} else if (direction == 3) {
		triangle(x*mapScale,(y+0.4*animationTimer)*mapScale,(x+0.5)*mapScale,(y+0.5)*mapScale,x*mapScale,(y+1-0.4*animationTimer)*mapScale);
		ellipseMode(CENTER);
		ellipse((x+0.5)*mapScale,(y+0.25)*mapScale,mapScale/4,mapScale/4);
	}
	if(pillActive){
		ellipseMode(CENTER);
		noFill();
		strokeWeight(2);
		stroke(255);
		ellipse((x+0.5)*mapScale,(y+0.5)*mapScale,mapScale*1.1,mapScale*1.1);
	}
}

function drawGhost(gameMap,mapScale,color,direction,x,y,animationTimer){
    drawGhostLegs(gameMap,mapScale,color,direction,x,y,animationTimer);
    stroke(0);
    strokeWeight(0);
    //fill(0);
    //rect(x*mapScale,(y+0.6)*mapScale,mapScale,mapScale*1.1/2);
    fill(255);
    ellipseMode(CENTER);
    ellipse((x+0.3)*mapScale,(y+0.3)*mapScale,mapScale/4,mapScale/4);
    ellipse((x+0.7)*mapScale,(y+0.3)*mapScale,mapScale/4,mapScale/4);

    fill(0);
    if(direction == 0) {
        ellipse((x+0.3)*mapScale,(y+0.25)*mapScale,mapScale/8,mapScale/8);
        ellipse((x+0.7)*mapScale,(y+0.25)*mapScale,mapScale/8,mapScale/8);
    } else if (direction == 1) {
        ellipse((x+0.35)*mapScale,(y+0.3)*mapScale,mapScale/8,mapScale/8);
        ellipse((x+0.75)*mapScale,(y+0.3)*mapScale,mapScale/8,mapScale/8);
    } else if (direction == 2) {
        ellipse((x+0.3)*mapScale,(y+0.35)*mapScale,mapScale/8,mapScale/8);
        ellipse((x+0.7)*mapScale,(y+0.35)*mapScale,mapScale/8,mapScale/8);
    } else if (direction == 3) {
        ellipse((x+0.25)*mapScale,(y+0.3)*mapScale,mapScale/8,mapScale/8);
        ellipse((x+0.65)*mapScale,(y+0.3)*mapScale,mapScale/8,mapScale/8);
    }
}
 
function drawGhostLegs(gameMap,mapScale,color,direction,x,y,animationTimer) {
 	
    fill(color);
    strokeWeight(0);
   
    var ctx = document.getElementById('defaultCanvas0').getContext('2d');
    radius = 0.5* mapScale;
    ctx.beginPath();
 
    x = x * mapScale +0.5 * mapScale;
    y = y * mapScale +0.5 * mapScale;
 
    ctx.arc(x, y, radius, Math.PI, 0, false);
    ctx.moveTo(x-radius, y);
  
    // LEGS
    if (!ghostLegToggle){
        ctx.lineTo(x-radius, y+radius);
        ctx.lineTo(x-radius+radius/3, y+radius-radius/4);
        ctx.lineTo(x-radius+radius/3*2, y+radius);
        ctx.lineTo(x, y+radius-radius/4);
        ctx.lineTo(x+radius/3, y+radius);
        ctx.lineTo(x+radius/3*2, y+radius-radius/4);
 
        ctx.lineTo(x+radius, y+radius);
        ctx.lineTo(x+radius, y);
    }
    else {
        ctx.lineTo(x-radius, y+radius-radius/4);
        ctx.lineTo(x-radius+radius/3, y+radius);
        ctx.lineTo(x-radius+radius/3*2, y+radius-radius/4);
        ctx.lineTo(x, y+radius);
        ctx.lineTo(x+radius/3, y+radius-radius/4);
        ctx.lineTo(x+radius/3*2, y+radius);
        ctx.lineTo(x+radius, y+radius-radius/4);
        ctx.lineTo(x+radius, y);
    }
 
    ctx.fill();
}

function windowResized() {
	w = window.innerWidth;
  	h = window.innerHeight;
  	mapScale = responsiveMap(gameMap.length,gameMap[0].length);
  	resizeCanvas(gameMap.length*mapScale,gameMap[0].length*mapScale);
    background('#0000FF')
    resetDraw();
}