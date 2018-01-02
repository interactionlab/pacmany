var startY, startX;
var startPillY, startPillX;
var circSize = 35;
var b1, b2, b3, b4, bPill; // up, down , left, right


var w = window.innerWidth;
var h = window.innerHeight;

var controlerScale = -1;
var pillReady = false;
var pillActive = true;
var pillSize = 50;
var players;

socket.on('test', function(data){
    console.log(data.text);
});

socket.on('PillEaten',function(){
    pillReady = true;
    drawController();
});

socket.on('color',function(data){
    controllerInfo.color = data.pacmanColor;
    drawController();
});

socket.on('gameOverPlayer', function(){
    $("#overlayWait").css('visibility', 'hidden');
    $("#overlayRejoin").css('visibility', 'visible');
});

socket.on('gameWonPlayer', function(){
    $("#overlayWait").css('visibility', 'hidden');
    $("#overlayRejoin").css('visibility', 'visible');
});

socket.on('lifeDrain', function() {
    controllerInfo.life -=1;
});

socket.on("waitForOtherPlayers", function (data) {
    $("#overlayWait").css('visibility', 'visible');
});

socket.on("resetLife", function (data) {
    controllerInfo.life = data.life;
});

socket.on("updateControllerColor", function(data){
    controllerInfo.color = data.color;
    drawController();
});

socket.on('updateScores', function(data) {
    players = [];
    for (chunk in data){
        inserted = false;
        if(data[chunk] && data[chunk] != 0){
            if(!players || players.length == 0){
                players = [data[chunk]]
            } else {
                for(player in players){
                    if(players[player].score <= data[chunk].score){
                        players.splice(player,0,data[chunk]);
                        inserted = true;
                        break;
                    }
                }
                if(!inserted) {
                    players.push(data[chunk]);
                }
            }
        }
    }
    drawController();
});

window.onbeforeunload = function(e) {
    socket.emit('disconnected');
};

function clickJoin(){
    controllerInfo.nickname = document.getElementById("nickname").value;

    if (controllerInfo.nickname == ""){
        $("#join").addClass("has-error");
    } else {
        $("#overlayJoin").css('visibility', 'hidden');
        socket.emit("connectController", controllerInfo, function (callback) {
            if(callback == -1){
                window.alert("This game is full. Try again later.").
                exit(-1)
            }
            console.log(callback);
            controllerInfo.playerid = callback.playerid;
            controllerInfo.color = callback.color;
            controllerInfo.life = callback.life;
            drawController();
        });
    }

}

function rejoind(){
    $("#overlayRejoin").css('visibility', 'hidden');
    socket.emit("rejoin", controllerInfo, function (callback) {
        if(callback.life){
            controllerInfo.life = callback.life;
        }
    });
}

function setup() {
    calculateScale();
    bPill = {"X" : startPillX + 25 * controlerScale, "Y" : startPillY + 25 * controlerScale}; 
	createCanvas(w,h);
	drawController();
}

function draw() {
	
}

function calculateScale(){
    w = window.innerWidth;
	h = window.innerHeight;
    controlerScale = w/100;
    
    startPillX = 0;
    startPillY = 0;
    if (window.matchMedia("(orientation: portrait)").matches) {
    	if (w < h/2){
    		controlerScale = w/100;
    		startPillX = w-(controlerScale*100);
    	}else{
    		controlerScale = h/2/100;
    	}
        
		startX = (w-(controlerScale*100))/ 2;
		startY = h-controlerScale*100;
		startPillX = w-(controlerScale*50);
		startPillY = (h/4)-controlerScale*25;
    }  else if (window.matchMedia("(orientation: landscape)").matches) {
        if (h < w/2){
    		controlerScale = h/100;
    	} else {
    		controlerScale = (w/2)/100;
    	}
		startX = w-controlerScale*100;
		startY = (h-(controlerScale*100))/ 2;
		startPillX = (w/4)-(controlerScale*25);
		startPillY = h-(h/4)-controlerScale*25;
    }
}


function drawController () {
    if (controlerScale == -1){
        calculateScale();
    }
	background(0);
    if(players){
        for(player in players) {
            drawPlayers(controlerScale, player, players[player].nickname, players[player].score,players[player].color);
        }
        if(controllerInfo.life){
            stroke(controllerInfo.color);
            strokeWeight(1);
            textSize(4*controlerScale);
            textAlign(LEFT);
            fill(controllerInfo.color);
            text("Life:",1*controlerScale,5*controlerScale)
            for(i = 0; i<controllerInfo.life; i++) {
                fill(255,0,0);
                noStroke();
                ellipse((10+(i*7))*controlerScale,1*controlerScale,5*controlerScale,5*controlerScale);
            }
            for(player in players) {
                if(players[player].id == controllerInfo.playerid){
                    stroke(controllerInfo.color);
                    strokeWeight(1);
                    textSize(4*controlerScale);
                    textAlign(LEFT);
                    fill(controllerInfo.color);
                    text("Pills Left: "+players[player].pillCount + " Portals used: " + players[player].portalsused,(10+(i)*7)*controlerScale,5*controlerScale);
                }
            }
        } else {
            stroke(controllerInfo.color);
            strokeWeight(1);
            textSize(4*controlerScale);
            textAlign(LEFT);
            fill(controllerInfo.color);
            text("Pills Left: "+players[0].pillCount + " Portals used: " + players[0].portalsused,10*controlerScale,5*controlerScale);
        }
	}
	drawPill(controlerScale);
	drawControlls(controlerScale);
}

function drawPlayers(controlerScale, number, nickname, score,color = controllerInfo.color) {
	noStroke();
	fill(color);
	ellipseMode(CORNER);
	rectMode(CORNER);
	ellipse(42.2*controlerScale, 10*controlerScale + 7*number*controlerScale, 5*controlerScale, 5*controlerScale);
	rect(0, 10*controlerScale + 7*number*controlerScale,45*controlerScale,5*controlerScale);
	stroke(0);
	strokeWeight(1);
	textSize(4*controlerScale);
	textAlign(LEFT);
	fill(0);
	text(nickname, 5 * controlerScale, 14 * controlerScale + 7 * controlerScale * number);
	textAlign(RIGHT);
    text(score, 42 * controlerScale, 14 * controlerScale + 7 * controlerScale * number);
}

function drawPill(controlerScale) {
	if(pillReady){
        
        bPill = {"X" : startPillX + 25 * controlerScale, "Y" : startPillY + 25 * controlerScale}; 
		fill(controllerInfo.color);
		ellipseMode(CENTER);
		ellipse(bPill.X, bPill.Y, pillSize * controlerScale, pillSize * controlerScale);
		textAlign(CENTER);
		stroke(0);
		fill(0);
		textSize(6*controlerScale);
		text("Activate Pill",startPillX + 25*controlerScale, startPillY + 27*controlerScale,);
	}
}


function drawControlls(controlerScale) {
    fill(0);
    stroke(controllerInfo.color);
    fill(controllerInfo.color);
    stroke(0);
    b1 = {"X" : startX + 50 * controlerScale, "Y" : startY + circSize/2 * controlerScale};
	b2 = {"X" : startX + 50 * controlerScale, "Y" : startY + (100-circSize/2) * controlerScale};
	b3 = {"X" : startX + circSize/2*controlerScale, "Y" : startY + 50 * controlerScale};
	b4 = {"X" : startX + (100-circSize/2)*controlerScale, "Y" : startY + 50 * controlerScale};      
    ellipseMode(CENTER);
    ellipse(b1.X, b1.Y, circSize * controlerScale, circSize * controlerScale);
    ellipse(b2.X, b2.Y, circSize * controlerScale, circSize * controlerScale);
    ellipse(b3.X, b3.Y, circSize * controlerScale, circSize * controlerScale);
    ellipse(b4.X, b4.Y, circSize * controlerScale, circSize * controlerScale);
    fill(0);        
	rectMode(CENTER);
	var cW = b1.X;
	var cH = b1.Y + 2*controlerScale;
	triangle(cW, cH-16*controlerScale, cW+8*controlerScale, cH, cW-8*controlerScale, cH);
	rect(cW, cH+ 4*controlerScale, 10*controlerScale, 10*controlerScale);

	var cW = b2.X;
	var cH = b2.Y - 2*controlerScale;
	triangle(cW, cH+16*controlerScale, cW+8*controlerScale, cH, cW-8*controlerScale, cH);
	rect(cW, cH- 4*controlerScale, 10*controlerScale, 10*controlerScale);

	var cW = b3.X + 2*controlerScale;
	var cH = b3.Y;
	triangle(cW-16*controlerScale, cH, cW, cH-8*controlerScale, cW, cH+8*controlerScale);
	rect(cW + 4*controlerScale, cH, 10*controlerScale, 10*controlerScale);

	var cW = b4.X - 2*controlerScale;
	var cH = b4.Y;
	triangle(cW+16*controlerScale, cH, cW, cH-8*controlerScale, cW, cH+8*controlerScale);
	rect(cW- 4*controlerScale, cH, 10*controlerScale, 10*controlerScale);

    // Testing
	// window.setTimeout(drawController, 1000);
}

function mousePressed() {
    data = {
        gameid: controllerInfo.gameid,
        playerid: controllerInfo.playerid,
        newDirection: -1
    }
	if(Math.sqrt(Math.pow(mouseX-b1.X,2)+Math.pow(mouseY-b1.Y,2)) < circSize/2*controlerScale){
		data.newDirection = 0;
	} else if (Math.sqrt(Math.pow(mouseX-b2.X,2)+Math.pow(mouseY-b2.Y,2)) < circSize/2*controlerScale) {
		data.newDirection = 2;
	} else if (Math.sqrt(Math.pow(mouseX-b3.X,2)+Math.pow(mouseY-b3.Y,2)) < circSize/2*controlerScale) {
		data.newDirection = 3;
	} else if (Math.sqrt(Math.pow(mouseX-b4.X,2)+Math.pow(mouseY-b4.Y,2)) < circSize/2*controlerScale) {
		data.newDirection = 1;
	} else if (Math.sqrt(Math.pow(mouseX-bPill.X,2)+Math.pow(mouseY-bPill.Y,2)) < pillSize/2*controlerScale) {
		if(pillReady) {
			pillReady = false;
			drawController();
			socket.emit("pillused", data = {gameid:controllerInfo.gameid, playerid:controllerInfo.playerid});
            return;
		}
	}
    if (data.newDirection != -1)
        socket.emit("changeDirection", data);
}

function keyPressed() {
    data = {
        gameid: controllerInfo.gameid,
        playerid: controllerInfo.playerid,
        newDirection: -1
    }
	if(keyCode == 38){
		data.newDirection = 0;
	} else if(keyCode == 39){
		data.newDirection = 1;
	} else if(keyCode == 40){
		data.newDirection = 2;
	} else if(keyCode == 37){
		data.newDirection = 3;
	} else if(keyCode == 80){
		if(pillReady) {
			pillReady = false;
			drawController();
			socket.emit("pillused", data = {gameid : controllerInfo.gameid, playerid : controllerInfo.playerid});
            return;
		}
	}
    
    if (data.newDirection != -1)
        socket.emit("changeDirection", data);
}


function windowResized() {
  	resizeCanvas(window.innerWidth, window.innerHeight);  
    calculateScale();	
  	drawController();
}