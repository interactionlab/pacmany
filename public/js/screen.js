var w = window.innerWidth;
var h = window.innerHeight;

var players = [];
var ghosts = [];
var pills = [];
var wormholes = [];
var mapScale,
    pillSize,
    pillSizeFactor,
    animationTimer,
    animationTimerFactor,
    startTime,
    wormholeTimer,
    wormholeFactor;
var ghostLegToggle = false;
var score = 0;
var maxScore = 0;
var lives = 0;
var splitscreenDifference = Math.floor(gameMap.length/2);
var splitter;
var setupDone = false;

//For debuging:--------    
function mouseClicked(){
    var win = window.open("/controller?gameid=" + gameid)
    win.focus();
}
//--------------

if(gameid != ""){
    if(splitscreen < splits) {
        $( "html,body" ).css( "float", "right" );
        window.open("/screen?gameid="+gameid + "&splits="+ splits + "&splitscreen="+ (splitscreen+1) ,"_blank");
    } else {
        $( "html,body" ).css( "float", "left" );
    }
    socket.emit("connectScreen", {gameid: gameid, screenid:screenid}, function(response){
        if (!(response == false)){
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
        wormholes = data.wormholes;        
        if (splitscreen == splits){
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
        }
        drawMain(gameMap,mapScale);
    });
    
    socket.on("gameCountDown", function(data){
        $( "#overlay" ).css( "visibility", "visible" );
        $( "#time" ).text(Math.floor(data.time / 1000));
    });
    
    socket.on("gameOver", function(data){
        $( "#overlay" ).css( "visibility", "visible" );
        $( "#time" ).text("!!! Game Over !!! \n No Lives left");
    });
    
    socket.on("gameWon", function(data){
        $( "#overlay" ).css( "visibility", "visible" );
        if(typeof data.winner === 'string'){
            $( "#time" ).text("!!! "+data.winner+" Won !!!");
        } else {
            $( "#time" ).text("!!! Game Won !!!");
        }
    });
    
    socket.on("updateMap", function(data){
        gameMap[data.x][data.y] = data.value;
    });
    
    socket.on("resetMap", function(data) {
        gameMap  = jQuery.extend(true, [], mapOriginal);
        resetDraw();
    });
    socket.on("redrawTile", function(data) {
        fill(0);
        strokeWeight(5);
        stroke(0);
        if(splitscreen == 0){
            rect(data.x*mapScale,data.y*mapScale,mapScale,mapScale);
        } else {
            rect((data.x-splitter*splitscreen)*mapScale,data.y*mapScale,mapScale,mapScale);
        }
    })
}

$(document).ready(function() {
    if (splitscreen == splits){
        p = ":" + port;
        if (port == 80 && location.protocol == "http"){
            p = ""
        } else if (port == 443 && location.protocol == "https"){
            p = ""
        }
        new QRCode(document.getElementById("qrcode"), location.protocol + '//' + location.hostname + p + "/controller?gameid="+ gameid);
    }
    if (splitscreen != splits || showHighScore == 0) {
        document.getElementById("score").style.display = "none";
    }
    if (showQRCode == 0 || splitscreen != splits){
        $("#qrcode").css( "display", "none" );
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

function setup() {
    w = window.innerWidth;
  	h = window.innerHeight;
    frameRate(30);
    
    if (splits != 0){
        splitter = Math.ceil(gameMap.length/(splits+1))
    } else {
        splitter = gameMap.length;
    }
    
    mapScale = responsiveMap(splitter,gameMap[0].length)
    
    var canvasWidth = splitter*mapScale;
    var canvasHeight = gameMap[0].length*mapScale;
    var cnv = createCanvas(canvasWidth, canvasHeight);
    cnv.parent('pacmany-holder');
    
    fill('#151584');
    noStroke();
    rect(0,0,w,h);
    
    startTime = 0;
    pillSize = 4; 
    pillSizeFactor = 0.5;
    animationTimer = 0;
    animationTimerFactor = 0.25;
    wormholeTimer = 0;
    wormholeFactor = 0.1;
    
    noLoop();
    resetDraw();
    
    if (w- canvasWidth > h-canvasHeight){
        $("body").css("display", "flex");
    } else {
        $("body").css("display", "block");
    }    
	
	setupDone = true;
}

function resetDraw(){
    drawMain();
    drawInitMap();
}

function drawInitMap (){
    end = (splitscreen+1)*splitter;
    if (splitscreen == splits){
        end = gameMap.length;
    }
    for (i = splitscreen*splitter; i < end; i++) {
        for(j=0; j < gameMap[i].length;j++ ){
            fill(0)
            strokeWeight(5);
            stroke(0);
            if(gameMap[i][j] == 1){
                rect((i-(splitscreen*splitter))*mapScale,j*mapScale,mapScale,mapScale);
                drawFood((i-(splitscreen*splitter)),j, mapScale);
            } else if ( gameMap[i][j] == 2 || gameMap[i][j] == 3 ||  gameMap[i][j] == 3) {
                rect((i-(splitscreen*splitter))*mapScale,j*mapScale,mapScale,mapScale);
            }
        }
    }
}

function drawFood(x,y,mapScale){
    fill(100);
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

function drawMain(){
    if(animationTimer <0){
        animationTimerFactor = -1*animationTimerFactor;
    } else if (animationTimer > 1){
        animationTimerFactor = -1*animationTimerFactor
    }
    if(wormholeTimer < -1){
        wormholeFactor = -1*wormholeFactor;
    }else if(wormholeTimer >1){
        wormholeFactor= -1*wormholeFactor;
    }
    if(pillSize > 6){
        pillSizeFactor = -1*pillSizeFactor;
    } else if (pillSize < 2){
        pillSizeFactor = -1*pillSizeFactor
    }
    wormholeTimer+= wormholeFactor;
    pillSize+=pillSizeFactor;
    animationTimer+=animationTimerFactor;   
    if(splitscreen == 0) {
        for (i=0;i<players.length;i++){
            for(n = -1; n<2; n++){
                for(m = -1; m<2; m++){
                    if( n+players[i].posX < gameMap.length && n+players[i].posX >0){
                        fill(0)
                        strokeWeight(5);
                        stroke(0);
                        if(gameMap[Math.floor(players[i].posX+n)][Math.floor(players[i].posY+m)] == 1){
                        rect(Math.floor(players[i].posX+n)*mapScale,Math.floor(players[i].posY+m)*mapScale,mapScale,mapScale);
                        drawFood(Math.floor(players[i].posX+n),Math.floor(players[i].posY+m), mapScale);
                    } else if ( gameMap[Math.floor(players[i].posX+n)][Math.floor(players[i].posY+m)] == 2 || gameMap[Math.floor(players[i].posX+n)][Math.floor(players[i].posY+m)] == 3) {
                        fill(0)
                    strokeWeight(5);
                    stroke(0);
                        rect(Math.floor(players[i].posX+n)*mapScale,Math.floor(players[i].posY+m)*mapScale,mapScale,mapScale);
                    }
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
                    fill(0)
                    strokeWeight(5);
                    stroke(0);
                    rect(Math.floor(ghosts[i].posX+n)*mapScale,Math.floor(ghosts[i].posY+m)*mapScale,mapScale,mapScale);
                }
                }
            }
        }
            for (i=0;i<pills.length;i++){
            if(pills[i].ready == true) {
                drawPills(pills[i].position.x,pills[i].position.y,mapScale, pillSize,pills[i].color);
            }   else {
                fill(0);
                rect(pills[i].position.x*mapScale,pills[i].position.y*mapScale,mapScale,mapScale);
            }
        } 
        for(wormhole in wormholes){
            drawWormhole(mapScale,wormholes[wormhole].x,wormholes[wormhole].y,animationTimer,wormholes[wormhole].ready,wormholes[wormhole].destX*mapScale,wormholes[wormhole].destY*mapScale);
        }

        for (i=0;i<players.length;i++){
            drawPacman(gameMap,mapScale,players[i].direction,players[i].posX,players[i].posY,players[i].color,animationTimer,players[i].pillActive);
        }
        
        for(i=0;i<ghosts.length;i++){
            drawGhost(gameMap,mapScale,ghosts[i].color,ghosts[i].direction,ghosts[i].posX,ghosts[i].posY,animationTimer);
        }
    } else {
        fill(0)
        strokeWeight(5);
        stroke(0);
        for (i=0;i<players.length;i++){
            for(n = -1; n<2; n++){
                for(m = -1; m<2; m++){
                    fill(0)
                    strokeWeight(5);
                    stroke(0);
                    if(gameMap[Math.floor(players[i].posX+n)][Math.floor(players[i].posY+m)] == 1){
                    rect(Math.floor(players[i].posX+n-splitter*splitscreen)*mapScale,Math.floor(players[i].posY+m)*mapScale,mapScale,mapScale);
                    drawFood(Math.floor(players[i].posX+n-splitter*splitscreen),Math.floor(players[i].posY+m), mapScale);
                } else if ( gameMap[Math.floor(players[i].posX+n)][Math.floor(players[i].posY+m)] == 2 || gameMap[Math.floor(players[i].posX+n)][Math.floor(players[i].posY+m)] == 3 || gameMap[Math.floor(players[i].posX+n)][Math.floor(players[i].posY+m)] == 4) {
                    fill(0)
                    strokeWeight(5);
                    stroke(0);
                    rect(Math.floor(players[i].posX+n-splitter*splitscreen)*mapScale,Math.floor(players[i].posY+m)*mapScale,mapScale,mapScale);
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
                    rect(Math.floor(ghosts[i].posX+n-splitter*splitscreen)*mapScale,Math.floor(ghosts[i].posY+m)*mapScale,mapScale,mapScale);
                    drawFood(Math.floor(ghosts[i].posX+n-splitter*splitscreen),Math.floor(ghosts[i].posY+m), mapScale);
                } else if ( gameMap[Math.floor(ghosts[i].posX+n)][Math.floor(ghosts[i].posY+m)] == 2 || gameMap[Math.floor(ghosts[i].posX+n)][Math.floor(ghosts[i].posY+m)] == 3 || gameMap[Math.floor(ghosts[i].posX+n)][Math.floor(ghosts[i].posY+m)] == 4) {
                    fill(0)
                    strokeWeight(5);
                    stroke(0);
                    rect(Math.floor(ghosts[i].posX+n-splitter*splitscreen)*mapScale,Math.floor(ghosts[i].posY+m)*mapScale,mapScale,mapScale);
                }
                }
            }
        }
        for (i=0;i<pills.length;i++){
            if(pills[i].ready == true){
                drawPills(pills[i].position.x-splitter*splitscreen,pills[i].position.y,mapScale, pillSize,pills[i].color);
            } else {
                fill(0);
                strokeWeight(5);
                stroke(0);
                rect(pills[i].position.x-splitter*splitscreen,pills[i].position.y,mapScale,mapScale);
            }
        } 
        for(wormhole in wormholes){
            drawWormhole(mapScale,wormholes[wormhole].x-splitter*splitscreen,wormholes[wormhole].y,animationTimer,wormholes[wormhole].ready,wormholes[wormhole].destX*mapScale,wormholes[wormhole].destY*mapScale);
        }
        for (i=0;i<players.length;i++){
            drawPacman(gameMap,mapScale,players[i].direction,players[i].posX-splitter*splitscreen,players[i].posY,players[i].color,animationTimer,players[i].pillActive);
        }

        for(i=0;i<ghosts.length;i++){
            drawGhost(gameMap,mapScale,ghosts[i].color,ghosts[i].direction,ghosts[i].posX-splitter*splitscreen,ghosts[i].posY,animationTimer);
        }
    }
    if (ghostLegToggle) {
            ghostLegToggle = false;
        } else {
            ghostLegToggle = true;
        }
    
    
    
    if (splitscreen == 0){
        fill('#151584');
        stroke('#151584');
        rect(0,0,15*mapScale,0.8*mapScale);
    }
    
    if (splitscreen == splits){
        fill('#151584');
        stroke('#151584');
        rect((splitter-15)*mapScale,0,splitter*mapScale,0.8*mapScale);
    }
    
    textSize(1*mapScale);
    strokeWeight(1);
    fill('#FFFF00');
    stroke('#FFFF00');
    textAlign(LEFT);
    textStyle(BOLD);
    if (splitscreen == 0){
        if(gamemode != "Collaborative") {
           text("Score: "+score+"/"+maxScore,0.75*mapScale,0.75*mapScale);
        }
    }
    
    if (splitscreen == splits){
        textAlign(RIGHT);
        if(gamemode != "Collaborative") {
            text("Lives: "+lives,(splitter-0.75)*mapScale,0.75*mapScale);
        }
    }
}
function drawWormhole(mapScale,x,y,animationTimer,ready,destX,destY){
    console.log(x+"--"+ y);
    fill(0);
    strokeWeight(5);
    stroke(0);
    rect(x*mapScale,y*mapScale,mapScale,mapScale);
    strokeWeight(2);
    noFill();
    stroke('#39ff14');
    ellipseMode(CENTER);
    if(ready){
        ellipse((x+0.5)*mapScale,(y+0.5)*mapScale,(0.8-0.6*Math.abs(wormholeTimer))*mapScale, (0.4+0.6*Math.abs(wormholeTimer))*mapScale);
        ellipse((x+0.5)*mapScale,(y+0.5)*mapScale,(0.4+0.6*Math.abs(wormholeTimer))*mapScale, (0.8-0.6*Math.abs(wormholeTimer))*mapScale);
        line((x+0.5)*mapScale,(y+0.5)*mapScale,(x+0.5)*mapScale+destX,(y+0.5)*mapScale+destY);
    } else {
        ellipse((x+0.5)*mapScale,(y+0.5)*mapScale,0.9 * mapScale,0.9 * mapScale);
    }

}

function drawPacman(gameMap,mapScale,direction,x,y,color,animationTimer,pillActive){
    fill(color);
    ellipseMode(CENTER);
    strokeWeight(1)
    stroke(0);
    ellipse((x+0.5)*mapScale,(y+0.5)*mapScale,mapScale*0.9,mapScale*0.9);
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
        strokeWeight(1);
        stroke(255);
        ellipse((x+0.5)*mapScale,(y+0.5)*mapScale,mapScale*0.95,mapScale*0.95);
        stroke(0);
    }
}

function drawGhost(gameMap,mapScale,color,direction,x,y,animationTimer){
    drawGhostLegs(gameMap,mapScale,color,direction,x,y,animationTimer);
    stroke(0);
    strokeWeight(0);
    
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
	if (setupDone == false)
		return;
	
  	mapScale = responsiveMap(splitter,gameMap[0].length);
    var canvasWidth = splitter*mapScale;
    var canvasHeight = gameMap[0].length*mapScale;
  	resizeCanvas(canvasWidth, canvasHeight);
    background('#151584')
    resetDraw();
    
    if (w- canvasWidth > h-canvasHeight){
        $("body").css("display", "flex");
    } else {
        $("body").css("display", "block");
    }
}