var express = require('express');
var app = express();
var fs = require('fs');
var glob = require("glob");
var bodyParser = require('body-parser')
var device = require('express-device');
var path = require('path');
var uaparser = require('ua-parser-js');
var async = require('async')

var GAME_CONFIG = require('./config.json');

var https = require('http').Server(app);
var io = require('socket.io')(https);

var pool = require('./db');

var sql = fs.readFileSync('db.sql').toString();

pool.connect(function(err, client, done) {
    if(err) {
        console.error('ERROR #001: DB connection could not be established, check DB connection.', err);
        process.exit(1);
        return;
    }
    client.query(sql, function(err, result){
        done();
        if(err){
            console.log('ERROR #002: could not init db', err);
            process.exit(1);
        }
    });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(device.capture());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

index = require('./routes/imprint')
app.use('/', index);
app.use('/screen', require('./routes/screen'));
app.use('/games', require('./routes/games'));
app.use('/imprint', index);
app.use('/controller', require('./routes/controller'));


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;

var ConnectedOverviews = [];

io.on('connection', function(socket){
    
    socket.on("connectOverview", function(data,callback) {
        socket.join(socket.id);
        ConnectedOverviews.push(socket.id);
    });
    
    socket.on("connectScreen", function(data,callback) {
        console.log("New screen connected to game ID: " + data.gameid + " screen ID: " + data.screenid);
        if (Games[data.gameid] != null){
            Games[data.gameid].connectedScreens.push(socket);
            socket.join(data.gameid);
            callback({gamemode: Games[data.gameid].gamemode});
        } else {
            //callback(false);
            console.error("ERROR #015: game is null");
       }
    });
    
    socket.on("connectController", function(data, callback) {
        console.log("A new controller connecting to game ID: " + data.gameid)
        if(Games[data.gameid].players.length >= Games[data.gameid].maxPlayers){
        	callback(-1)
        	return
        }
        if (Games[data.gameid] != null){
            var ua = uaparser(data.useragent);
            
            if (Games[data.gameid].players.length == 0){
                var newColor = [255,0,255];
            } else if (Games[data.gameid].players.length == 1){
                var newColor = [255,255,0];
            } else {
                var newColor = Games[data.gameid].getPlayerColor();
            }
            pool.connect(function(err, client, done) {
                if(err) {
                    return console.error('ERROR #010: fetching client from pool', err);
                } else {
                    client.query('INSERT INTO controller(color, model, type, nickname, resolution) VALUES($1, $2, $3, $4, $5) RETURNING ID', [newColor, ua.device.model, ua.device.type, data.nickname, data.resolution], function(err, result) {
                        done(err);
                        if(err) {
                            return console.error('ERROR #011: running query',err);
                        } else {
                            playerid = result.rows[0].id
                            console.log("playerid", playerid);
                            socket.join(playerid);
                            if(Games[data.gameid].gamemode == "Competitive"){
                                Games[data.gameid].addPlayer(playerid, data.nickname, newColor, socket, socket.id);
                                socket.to(playerid).emit("resetLife",{life:GAME_CONFIG.GAME_LIFE_COUNT});
                            } else{
                                Games[data.gameid].addPlayer(playerid, data.nickname, newColor, socket, socket.id);
                            }
                            if(Games[data.gameid].gamemode =="Competitive"){
                                callback({playerid : playerid, color : newColor,life : GAME_CONFIG.GAME_LIFE_COUNT});
                            } else {
                                callback({playerid : playerid, color : newColor});
                            }
                        }
                    });
                }
            });
        } else {
            console.error("ERROR #012: not a valid game " + data.gameid);
        }
    });

    socket.on("updateRequest", function(data) {
        if (Games[data] != null){
            Games[data].runGame = true;
        } else {
            console.error("ERROR #009: not a valid game " + data);
        }
    });

    socket.on("testEmit",function () {
        console.log("Done");
    });

    socket.on("oldGameConnected", function(data){
        var gameid = data.gameid;
        socket.join(gameid);
        socket.emit("gameData", data= {
            usedMap: Games[gameid].usedMap,
            players: Games[gameid].players,
            ghosts: Games[gameid].ghosts
        });
    });   

    socket.on("pillused", function(data){
        if (Games[data.gameid] != null){
            var players = Games[data.gameid].players;
            for (i = 0; i < players.length; i++) {
                if(players[i].playerid == data.playerid) {
                    players[i].pillActive = true;
                    setTimeout(function(player) {player.pillActive = false}, 3000, players[i])
                    pool.connect(function(err, client, done) {
                        if(err) {
                            return console.error('ERROR #007: fetching client from pool', err);
                        } else {
                            client.query('INSERT INTO player_action(game_id, controller_id, player_actiontype, action_data) VALUES($1, $2, $3, $4)',[data.gameid, data.playerid, 4, "1"], function(err, result) {
                                done(err);
                                if(err) {
                                    return console.error('ERROR #006: running query',err);
                                }
                            });
                        }
                    });
                    break;
                }
            }
        } else {
        console.error("ERROR #008: not a valid game " + data.gameid);
        }
    });

    socket.on("changeDirection", function(data){
        if (Games[data.gameid] != null){
            var players = Games[data.gameid].players;
            for (i=0; i < players.length;i++) {
                if(players[i].playerid == data.playerid) {
                    players[i].setNewDirection(data.newDirection);
                    X = players[i].posX;
                    Y = players[i].posY;
                    pool.connect(function(err, client, done) {
                        console.log("Player move:", data);
                        if(err) {
                            return console.error('ERROR #005: fetching client from pool', err);
                        } else {
                            client.query('INSERT INTO player_action(game_id, controller_id, player_actiontype, action_data) VALUES($1, $2, $3, $4)',[data.gameid, data.playerid, 1, {"direction":data.newDirection,"X":X,"Y":Y}], function(err, result) {
                                done(err);
                                if(err) {
                                    return console.error('ERROR #004: running query', err);
                                }
                            });
                        }
                    });
                    return;
                }
            }
            console.error("ERROR #003: not a valid player " + data.playerid);
        } else {
            console.error("ERROR #002: not a valid game " + data.gameid);
        }
    });

    socket.on("restartGame",function(data) {
        if (Games[data.gameid] != null){
            Games[data.gameid].restart();
        } else {
            console.error("ERROR #026: not a valid game " + data.gameid);
        }
    });

    socket.on("deleteGame",function(data) {
        delete Games[data.gameid];
        });
    
    socket.on("rejoin",function(data,callback) {
        console.log("A controller rejoined!")
        if (Games[data.gameid] != null){
            socket.join(data.playerid);
            
            Games[data.gameid].addPlayer(data.playerid, data.nickname, data.color, socket,
            data.socketid);
            io.to(data.playerid).emit("updateControllerColor",{color:data.color});
            if (Games[data.gameid].gamemode == "Competitive"){
                callback({life:GAME_CONFIG.GAME_LIFE_COUNT})
            }
        } else {
          console.error("ERROR #025: not a valid game " + data.gameid);
        }
    });
    
    socket.on('disconnect', function() {
        console.log("Disconnect by ID:", socket.id);
        for(key in Games){
            game = Games[key]
            screenIndex = game.connectedScreens.indexOf(socket);
            if (screenIndex != -1){
                game.connectedScreens.splice(screenIndex, 1);
                console.log("...Screen disconnected");
                return;
            }
            
            for(i=0; i < game.players.length; i++){
                if(game.players[i].socket == socket){
                    data = {'x': game.players[i].posX,'y': game.players[i].posY};
                    socket.to(game.gameid).emit("redrawTile", data);
                    game.players.splice(i,1);
                    console.log("...Player disconnected");
                    return; 
                }
            }
        }
    });

    socket.on("createNewGame", function(data,callback){
        console.log("creating new Game")
        pool.connect(function(err, client, done) {
            if(err) {
                return console.error('ERROR #013: fetching client from pool', err);
            } else{
                client.query('INSERT INTO games(name, map, location,gamemode) VALUES($1, $2, $3, $4) RETURNING ID',[data.name, data.map, data.place, data.gamemode], function(err, result) {
                    done(err);
                    if(err) {
                        return console.error('ERROR #014: running query',err);
                    } else {
                        gameid = result.rows[0].id
                        
                        showQRCode = ~~data.showQRCode;
                        if (showQRCode != 1)
                            showQRCode = 0;
                        
                        showHighScore = ~~data.showHighScore;
                        if (showHighScore != 1)
                            showHighScore = 0;
                        
                        console.log("Game Created ID: " + gameid);
                        mapFile = "map_"+ data.map.replace('/', '_') + ".js";
                        Games[gameid] = new ClassGame(mapFile, gameid, data.name, data.place, data.gamemode, showQRCode, showHighScore,data.maxPlayers,data.portalPairs,data.pillsPerPlayer);
                        Games[gameid].init();
                        console.log(gameid +" " +data.splits);
                        callback("/screen?gameid=" + gameid+"&splits="+data.splits+"&splitscreen=0");
                    }
                });
            }
        });
    })

});

var port = GAME_CONFIG.CONFIG_PORT;
https.listen(port, function () {
    console.log('listening on *:'+port);
});

function getMaxScore(usedMap){
    mScore = 0;
    for (var x = 0; x<usedMap.length;x++) {
        for (var y = 0;y < usedMap[0].length;y++) {
            if(usedMap[x][y] == 1) {
                mScore +=1
            } else if(usedMap[x][y] == 4){
                mScore += 5;
            }
        }
    }
    return mScore;
}

GAME_GAME_OVER = 0;
GAME_GAME_WON = 1;
GAME_COUNT_DOWN = 2;
GAME_RUNNING = 3;
GAME_IDLE = 4;

function ClassGame(mapFile, gameid, name, pLocation, gamemode, showQRCode, showHighScore, maxPlayers, portalPairs, pillsPerPlayer) {
    this.time = new Date().getTime();
    
    this.mapFile = mapFile;
    this.gamemode = gamemode;
    this.showQRCode = showQRCode;
    this.showHighScore = showHighScore;
    this.gameid = gameid;
    this.name = name;
    this.location = pLocation;
    this.maxPlayers = maxPlayers;
    this.portalPairs = portalPairs;
    this.pillsPerPlayer = pillsPerPlayer;

    this.lives = 5;
    this.gameScore = 0;
    this.portalsused = 0;
    
    this.players = [];
    this.ghosts = [];
    this.pills = [];
    this.connectedScreens = [];
    this.wormholes = [];
    
    this.gameState = GAME_IDLE;
}

ClassGame.prototype.getGhostPositon = function() {
    return this.mapData.POSITIONS_GHOSTS[Math.floor(Math.random()*this.mapData.POSITIONS_GHOSTS.length)];
}

ClassGame.prototype.gameStep = function() {
    for(i=0;i<this.ghosts.length;i++) {
        this.ghosts[i].move();
    }
    for(i=0;i<this.players.length;i++) {
        this.players[i].move();
    }
    this.collision();
}

ClassGame.prototype.addPlayer = function(playerid,  nickname, color, socket, socketid) {
    if (this.gameState == GAME_IDLE)
        this.switchGameState(GAME_COUNT_DOWN);
    
    if (this.gamemode  == "Competitive"){
        var life = GAME_CONFIG.GAME_LIFE_COUNT;
    }
    
    position = this.getRandPos();
    player = new ClassPlayer(this.gameid, playerid, nickname, color, position.x, position.y, this.getRandDirection(), socket, socketid, life);
    this.players.push(player);
    pool.connect(function(err, client, done) {
        if(err) {
            return console.error('Error #016: fetching client from pool', err);
        }
        client.query('INSERT INTO player_action(game_id, controller_id, player_actiontype, action_data) VALUES($1, $2, $3, $4)',[this.gameid, playerid, 0, {"x":position.x,"y":position.y}], function(err, result) {
            done(err);
            if(err) {
            return console.error('Error #017: running query',err);
            }
        });
    });
}


ClassGame.prototype.getPlayerColor = function() {
     do {
        difference = false;
        var rgb = Math.floor(Math.random()*3);
        if(rgb == 0) {
            color = [Math.floor(Math.random()*100+155), Math.floor(Math.random()*155), Math.floor(Math.random()*55)];
        } else if(rgb == 1) {
            color = [Math.floor(Math.random()*155), Math.floor(Math.random()*100+155), Math.floor(Math.random()*155)];
        } else {
            color = [Math.floor(Math.random()*155), Math.floor(Math.random()*55), Math.floor(Math.random()*100+155)];
        }
        for(player in this.players) {
            if(this.colorDistance(color, this.players[player].color)< 20){
                difference = true;
            }
        }
    } while(difference);
    return color;
}

ClassGame.prototype.colorDistance = function(color1,color2){
    return Math.sqrt(Math.pow(color1[0]-color2[0],2)+Math.pow(color1[1]-color2[1],2)+Math.pow(color1[2]-color2[2],2));
}

ClassGame.prototype.notifyPlayer = function(players,message,data) {
    for(i = 0; i < this.players.length;i++) {
        io.to(this.players[i].playerid).emit(message,data);
    }
}


ClassGame.prototype.getRandDirection = function(){
    return Math.floor(Math.random()*4);
}

ClassGame.prototype.getRandPos = function(){
        
        x = Math.floor(Math.random()*this.mapWidth);
        y = Math.floor(Math.random()*this.mapHeight);

    while(this.usedMap[x][y] != 1) {
        x = Math.floor(Math.random()*this.mapWidth);
        y = Math.floor(Math.random()*this.mapHeight);
        }
    return {x:x,y:y};
    
}

ClassGame.prototype.updateScreens = function(){    
    var playerList = [];
    for (p in this.players){
        if(!this.players[p].out){
            playerList.push({nickname : this.players[p].nickname, score : this.players[p].score, color : this.players[p].color, posX : this.players[p].posX, posY : this.players[p].posY, pillActive: this.players[p].pillActive, direction: this.players[p].direction});
        }
    }
    var wormholeList =[];
    for (w in this.wormholes){
        vecX = this.wormholes[w].destination.posX-this.wormholes[w].posX;
        vecY = this.wormholes[w].destination.posY-this.wormholes[w].posY;
        vecLen = Math.sqrt(Math.pow(Math.abs(vecX),2)+Math.pow(Math.abs(vecY),2));
        nvecX = vecX/(vecLen*2)
        nvecY = vecY/(vecLen*2)
        wormholeList.push({x:this.wormholes[w].posX,y:this.wormholes[w].posY,ready:this.wormholes[w].ready,destX :nvecX,destY:nvecY});
    } 
    data = {players:playerList, ghosts:this.ghosts, score:this.gameScore, maxScore:this.maxScore, lives:this.lives, pills:this.pills, wormholes:wormholeList}
    io.to(this.gameid).emit("updateScreens",data);
    this.emitScores();
}


ClassGame.prototype.emitScores = function() {
    var playerData = [];
    if(this.gamemode != "Collaborative"){
        for (player in this.players ){
            playerData.push({nickname: this.players[player].nickname, score: this.players[player].score, id : this.players[player].playerid, color : this.players[player].color, pillCount:this.players[player].pillCount,portalsused:this.players[player].portalsused});
        }
    } else {
        pc = 0;
        for(pill in this.pills){
            if(this.pills[pill].ready) {
                pc += 1;
            }
        }
        playerData.push({nickname: "Score", score: this.gameScore, id : this.gameid, pillCount: pc, portalsused: this.portalsused});
    }
    this.notifyPlayer(this.players,"updateScores", playerData);
}
    
ClassGame.prototype.collision = function() {
    for (player in this.players ){
        if(!this.players[player].out){
            var playerX = this.players[player].posX;
            var playerY = this.players[player].posY;
            if(playerX % 1 == 0 && playerY % 1 == 0) {
                if(this.usedMap[playerX][playerY] == 1){
                    this.players[player].score +=1;
                    this.gameScore +=1;               
                    this.usedMap[playerX][playerY] = 3;
                    io.to(this.gameid).emit("updateMap", data = {x:playerX,y:playerY,value:3})
                }
            }
            for(wormhole in this.wormholes) {
                if(playerX == this.wormholes[wormhole].posX && playerY == this.wormholes[wormhole].posY&& this.wormholes[wormhole].ready){
                    this.players[player].posX = this.wormholes[wormhole].destination.posX;
                    this.players[player].posY = this.wormholes[wormhole].destination.posY;
                    this.players[player].portalsused +=1;
                    this.wormholes[wormhole].ready = false;
                    this.wormholes[wormhole].destination.ready = false;
                    this.portalsused += 1;
                    setTimeout(function(wormhole) {wormhole.ready = true}, 5000, this.wormholes[wormhole]);
                    setTimeout(function(wormhole) {wormhole.ready = true}, 5000, this.wormholes[wormhole].destination);
                    switch(this.players[player].direction){
                        case 0:
                            io.to(this.gameid).emit("redrawTile",{x:playerX,y:playerY+1});
                            break;
                        case 1:
                            io.to(this.gameid).emit("redrawTile",{x:playerX-1,y:playerY});
                            break;
                        case 2:
                            io.to(this.gameid).emit("redrawTile",{x:playerX,y:playerY-1});
                            break;
                        case 3:
                            io.to(this.gameid).emit("redrawTile",{x:playerX+1,y:playerY});
                            break;
                        default:
                            break;
                    }
                }
            }
            pid = this.players[player].playerid;
            for(p in this.pills){
                pill = this.pills[p];
                if(pill.ready){
                    if(pill.position.x == playerX && pill.position.y == playerY) {
                        
                        if(this.gamemode == "Collaborative" || (
                        this.players[player].color[0] == pill.color[0] &&
                        this.players[player].color[1] == pill.color[1] &&
                        this.players[player].color[2] == pill.color[2])) {
                            if(this.gamemode == "Competitive"){
                                this.players[player].pillCount -= 1;
                            }
                            pill.ready = false;
                            this.players[player].score += 5;
                            this.gameScore +=5;
                            io.to(this.players[player].playerid).emit("PillEaten");
                        }
                    }
                }
            }
            if(this.players[player].isAlive){
                for(ghost in this.ghosts){
                    if(!this.players[player].pillActive && Math.sqrt(Math.pow(playerX-this.ghosts[ghost].posX,2)+Math.pow(playerY-this.ghosts[ghost].posY,2)) <= 1){
                        this.players[player].isAlive = false;
                        this.players[player].pillActive = true;
                        setTimeout(function(player) {player.pillActive = false},5000,this.players[player])
                        pool.connect(function(err, client, done) {
                            if(err) {
                                return console.error('Error #018: fetching client from pool', err);
                            }
                            client.query('INSERT INTO player_action(game_id, controller_id, player_actiontype, action_data) VALUES($1, $2, $3, $4)',[this.gameid, pid, 2, "0"], function(err, result) {
                                done(err);
                                if(err) {
                                    return console.error('Error #019: running query',err);
                                }
                            });
                        });
                        if(this.gamemode == "Competitive"){
                            this.players[player].lives -= 1;
                            io.to(this.players[player].playerid).emit("lifeDrain");
                            if(this.players[player].lives == 0){
                                out = this.players[player]
                                io.to(this.gameid).emit("redrawTile", {x:out.posX,y:out.posY});
                                io.to(out.playerid).emit("waitForOtherPlayers");
                                out.out = true;
                            }
                        } else {
                            this.lives -= 1;
                        }
                        try {
                            setTimeout(function(player,s) {s.setAlive(player,s)},3000,player,this);
                        } catch (e) {
                            if (e instanceof TypeError){
                                console.log("TypeError, Player or Game no longer exists.");
                            }
                        } 
                    }
                }
            }
        }
    }
}

ClassGame.prototype.setAlive = function(player,s){
    try {
        s.players[player].isAlive = true;
        s.players[player].direction = s.players[player].oldDirection;
    } catch (e) {
        if (e instanceof TypeError){
            console.error("TypeError");
        }
    }
}

ClassGame.prototype.restart = function(){
    this.switchGameState(GAME_GAME_OVER);
}

ClassGame.prototype.init = function(){
    this.mapData = require("./public/maps/" + this.mapFile).mapData();
    this.usedMap = JSON.parse(JSON.stringify(this.mapData.usedMap));
    this.mapWidth = this.mapData.usedMap.length;
    this.mapHeight = this.mapData.usedMap[0].length;
    this.maxScore = getMaxScore(this.mapData.usedMap);
    this.lives = GAME_CONFIG.GAME_LIFE_COUNT;
    this.gameScore = 0;
    this.portalsused = 0;

    //reset Player life
    for(player in this.players){
        this.players[player].lives = GAME_CONFIG.GAME_LIFE_COUNT;
    }
    for (i=0;i<this.portalPairs;i++){
        pos1 = this.getRandPos();
        pos2 = this.getRandPos();
        while (Math.abs(pos1.x-pos2.x) < this.mapWidth/3){
            pos2 = this.getRandPos();
        }
        hole1 = new ClassWormhole(pos1.x,pos1.y);
        hole2 = new ClassWormhole(pos2.x,pos2.y);
        hole1.addDestination(hole2);
        hole2.addDestination(hole1);
        this.wormholes.push(hole1);
        this.wormholes.push(hole2);
        this.usedMap[pos1.x][pos1.y] = 3;
        io.to(this.gameid).emit("updateMap", data = {x:pos1.x,y:pos1.y,value:3})
        this.usedMap[pos2.x][pos2.y] = 3;
        io.to(this.gameid).emit("updateMap", data = {x:pos2.x,y:pos2.y,value:3})
    }
    // reset pills
    this.pills = [];
    pillCount = 0;
    for (i = 0; i < this.mapWidth; i++) {
        for(j=0; j < this.mapHeight; j++ ){
            if (this.usedMap[i][j] == 4){
                if (this.gamemode == "Collaborative"){
                    this.pills.push(new ClassPill({x:i, y:j},0,255));
                } else {
                    if(pillCount % 2 == 0){
                        this.pills.push(new ClassPill({x:i, y:j},1,[255,0,255]));
                    } else {
                        this.pills.push(new ClassPill({x:i, y:j},2,[255,255,0]));
                    }
                    pillCount = pillCount +1;
                }
            }
        }
    }
    
    this.ghosts = [];
    for(i = 1; i <= this.mapData.GHOST_COUNT; i++) {
        this.ghosts.push(new ClassGhost(this.gameid, i, this.getRandPos(), this.mapData.GHOST_START_DIRECTION));
    }
}

ClassGame.prototype.switchGameState = function(new_GameState){
    if(new_GameState == GAME_IDLE) {
        io.to(this.gameid).emit("toIdle", {map: this.mapData.file});
    } else if (new_GameState == GAME_GAME_OVER){
        this.time = new Date().getTime();
        io.to(this.gameid).emit("gameOver", {});
        this.notifyPlayer(this.players, 'gameOverPlayer', data = {})
        this.players = [];
    } else if (new_GameState == GAME_GAME_WON){
        this.time = new Date().getTime();
        if(this.gamemode == "Competitive"){
            for(player in this.players){
                if(this.players[player].pillCount==0){
                    io.to(this.gameid).emit("gameWon", {winner : this.players[player].nickname});
                }
            }
        } else {
            io.to(this.gameid).emit("gameWon", {});
        }
        this.notifyPlayer(this.players,'gameWonPlayer',data = {})
        this.players = [];
    } else if (new_GameState == GAME_COUNT_DOWN){
        this.time = new Date().getTime();
        this.init();
        io.to(this.gameid).emit("resetMap", data = {mapFile:this.mapData.file})
        
    }
    
    this.gameState = new_GameState;
}

ClassGame.prototype.updateGame = function(){
    //try{
        if (this.connectedScreens.length == 0 && this.played == true){
            console.log("removed game");
            delete Games[this.gameid];
            return true;
        } else if(this.gameState == GAME_RUNNING){
            this.gameStep();
            this.updateScreens();
            
            // Is Game over? Is game won?
            if(this.gamemode == "Competitive"){
                var allDead = true;
                for(var player in this.players){
                    if(this.players[player].lives > 0){
                        allDead =false;
                    }
                    if(this.players[player].pillCount == 0 && this.players[player].score> 200 && this.players[player].portalsused > 6){
                    this.switchGameState(GAME_GAME_WON);
                    }
                }
                if(allDead && this.players.length > 0) {
                    this.switchGameState(GAME_GAME_OVER);
                }
                if(this.gameScore >= this.maxScore){
                    this.switchGameState(GAME_GAME_WON);
                }
            } else if(this.gamemode == "Collaborative"){
                var allPillsEaten = true;
                for(pill in this.pills){
                    if(this.pills[pill].ready){
                        allPillsEaten = false;
                    }
                }
                if(allPillsEaten && this.gameScore > 400 && this.portalsused > 12) {
                    this.switchGameState(GAME_GAME_WON);
                }
                if(this.lives <= 0) {
                    this.switchGameState(GAME_GAME_OVER);
                } else if(this.gameScore >= this.maxScore){
                    this.switchGameState(GAME_GAME_WON);
                }
            } else {
                if(this.lives <= 0) {
                    this.switchGameState(GAME_GAME_OVER);
                } else if(this.gameScore >= this.maxScore){
                    this.switchGameState(GAME_GAME_WON);
                }
            }
        } else if(this.gameState == GAME_COUNT_DOWN){
            timeleft = new Date().getTime() - this.time;
            
            if (this.ghosts.length == 0){
                for(i=1; i <= this.mapData.GHOST_COUNT;i++) {
                    this.ghosts.push(new ClassGhost(this.gameid, i, this.getGhostPositon(), this.mapData.GHOST_START_DIRECTION));
                }
            }
            
            // to show joining players
            this.updateScreens();
            
            if (timeleft <= GAME_CONFIG.GAME_COUNT_DOWN_TIME * 1000){
                io.to(this.gameid).emit("gameCountDown", data = {time : GAME_CONFIG.GAME_COUNT_DOWN_TIME * 1000 - timeleft});
            } else {
                this.switchGameState(GAME_RUNNING);
                this.time = new Date().getTime()
            }
            
        } else if(this.gameState == GAME_GAME_OVER) {
            if (new Date().getTime() - this.time >  GAME_CONFIG.GAME_DELAY_AFTER_GAME * 1000){
                this.switchGameState(GAME_IDLE);
            }
        } else if(this.gameState == GAME_GAME_WON) {
            if (new Date().getTime() - this.time > GAME_CONFIG.GAME_DELAY_AFTER_GAME * 1000){
                this.switchGameState(GAME_IDLE);
            }
        } else if(this.gameState == GAME_IDLE) {
            if (this.ghosts.length == 0){
                
                for(i=1; i <= this.mapData.GHOST_COUNT;i++) {
                    this.ghosts.push(new ClassGhost(this.gameid, i, this.getGhostPositon(), this.mapData.GHOST_START_DIRECTION));
                }
            }
            
            this.gameStep();
            this.updateScreens();
            
            if(this.players.length > 0){
                this.switchGameState(GAME_COUNT_DOWN);
            }
        } else {
            console.log('Nothing to do');
        }
    /*} catch (err) {
        console.log(err.message);
    }*/
    return true;
}


function ClassWormhole(posX,posY){
    this.posX = posX;
    this.posY = posY;
    this.destination;
    this.ready = true;
}

ClassWormhole.prototype.addDestination = function(destination){
    this.destination = destination;
}

function ClassPlayer(gameid, playerid, nickname, color, posX, posY, direction, socket, socketid,lives) {
    this.gameid = gameid;
    this.playerid = playerid;
    this.nickname = nickname;
    this.color = color;
    this.posX = posX;
    this.posY = posY;
    this.direction = direction;
    this.socket = socket;
    this.socketid = socketid;
    this.lives = lives;
    this.out = false;
   

    this.portalsused = 0;
    this.pillActive = false;
    this.isAlive = true;
    this.newDirection = direction;
    this.oldDirection = direction;
    this.score = 0;
    this.pillCount = 0;
    if(Games[this.gameid].gamemode == "Competitive"){
        for(pill in Games[this.gameid].pills){
            if(Games[this.gameid].pills[pill].id %2 == Games[this.gameid].players.length%2){
                this.pillCount+=1;
            }
        }
    }
}

ClassPlayer.prototype.setNewDirection = function(newDirection) {
    this.newDirection = newDirection;
}

ClassPlayer.prototype.move = function() {
    if(this.isAlive) {
        var oldPos = {
            x:this.posX,
            y:this.posY
        }

        this.oldDirection = this.direction;

        var newPos
        switch(this.direction) {
            case 0:
                newPos = {x:this.posX, y:this.posY - 0.25 };     
                break;
            case 1:
                newPos = {x:this.posX + 0.25, y:this.posY}
                break;
            case 2:
                newPos = {x:this.posX,y:this.posY + 0.25}
                break;
            case 3:
                newPos = {x:this.posX - 0.25, y:this.posY}
                break;
            default:
                this.direction  = this.oldDirection;
                newPos = oldPos;
            }
        if(newPos.y < 0){
            this.direction = 0;
            this.posY = Games[this.gameid].mapHeight-1;
            io.to(this.gameid).emit("redrawTile",oldPos);
            return;
        } else if (newPos.y >= Games[this.gameid].mapHeight) {
            this.direction = 2;
            this.posY = 0;
            io.to(this.gameid).emit("redrawTile",oldPos);
            return;
        }
        if(newPos.x <= 0){
            console.log("Test1");
            this.direction = 3;
            this.posX = Games[this.gameid].mapWidth-1;
            console.log(oldPos)
            io.to(this.gameid).emit("redrawTile",oldPos);
            return;
        } else if (newPos.x >= Games[this.gameid].mapWidth-1) {
            console.log("Test2");
            console.log(oldPos)
            this.direction = 1;
            this.posX = 1;
            io.to(this.gameid).emit("redrawTile",oldPos);
            return;
        }


        if(oldPos.x % 1 == 0 && oldPos.y % 1 == 0) {
            switch(this.oldDirection) {
                case 0:
                    if(Games[this.gameid].usedMap[oldPos.x][Math.floor(oldPos.y-0.25)] == 0){
                        this.direction = this.newDirection;
                        return;
                    }
                    break;
                case 1:
                    if(Games[this.gameid].usedMap[Math.floor(oldPos.x+1.25)][Math.floor(oldPos.y)] == 0){
                        this.direction = this.newDirection;
                        return;
                    }
                    break;
                case 2:
                    if(Games[this.gameid].usedMap[oldPos.x][Math.floor(oldPos.y+1.25)] == 0){
                        this.direction = this.newDirection
                        return;
                    }
                    break;
                case 3:
                    if(Games[this.gameid].usedMap[Math.floor(oldPos.x-0.25)][Math.floor(oldPos.y)] == 0){
                        this.direction = this.newDirection;
                        return;
                    }
                    break;
                default:
                    this.direction  = this.oldDirection;
                
            }
        } else if(newPos.x % 1 == 0 && newPos.y % 1 == 0) {
            var neighbours = [];
                neighbours.push(Games[this.gameid].usedMap[newPos.x][newPos.y-1]);
                neighbours.push(Games[this.gameid].usedMap[newPos.x+1][newPos.y]);
                neighbours.push(Games[this.gameid].usedMap[newPos.x][newPos.y+1]);
                neighbours.push(Games[this.gameid].usedMap[newPos.x-1][newPos.y]);
            
            switch(this.newDirection){
                case 0:
                    if(neighbours[0] != 0){
                        this.direction = this.newDirection;
                    }
                    break;
                case 1:
                    if(neighbours[1] != 0){
                        this.direction = this.newDirection;
                    }
                    break;
                case 2:
                    if(neighbours[2] != 0){
                        this.direction = this.newDirection;
                    }
                    break;
                case 3:
                    if(neighbours[3] != 0){
                        this.direction = this.newDirection;
                    }
                    break;
                default:
                    this.direction = this.newDirection;
                    break;
            }
        } 
        if(this.direction >= 4){
            this.direction = this.newDirection;
        }
        this.posX = newPos.x;
        this.posY = newPos.y;
    } else {
        this.direction = 4;
    }

}

function ClassGhost(gameid, ghostid, position, direction){
    this.gameid = gameid;
    this.id = ghostid;
    this.posX = position.x;
    this.posY = position.y;
    this.direction = direction;
    this.color = this.getRandColor();
    
    pool.connect(function(err, client, done) {
        if(err) {
            console.error('Error #020: fetching client from pool', err);
            return;
        } else {
            client.query('INSERT INTO ghost_movement(game_id, ghost_id, ghost_actiontype, action_data) VALUES($1, $2, $3, $4)',[gameid, ghostid, 0, {"x":position.x, "y":position.y}], function(err, result) {
                done(err);
                if(err) {
                    console.error('Error #021: running query', err);
                    return;
                }
            });
        }
    });
}

ClassGhost.prototype.move = function() {

    var oldPos = {x:this.posX, y:this.posY}
    var oldDirection = this.direction;

    switch(this.direction) {
        case 0:
            var newPos = { x:this.posX, y:this.posY - 0.25};
            break;
        case 1:
            var newPos = {x:this.posX + 0.25, y:this.posY}
            break;
        case 2:
            var newPos = {x:this.posX, y:this.posY + 0.25}
            break;
        case 3:
            var newPos = {x:this.posX - 0.25, y:this.posY}
            break;
        default:
            console.error("ERROR #051: Ghost wrong direction");
            return;
    }
    
    if (Games[this.gameid] == null){
        console.error("ERROR #028: game is null, game id " + this.gameid);
        return;
    }
            
    
    if(newPos.y < 0){
        this.direction = 0;
        this.posY = Games[this.gameid].mapHeight-1;
        return;
    } else if (newPos.y >= Games[this.gameid].mapHeight) {
        this.direction = 2;
        this.posY = 0;
        return;
    }

    if(newPos.x <= 0){
        this.direction = 3;
        this.posX = Games[this.gameid].mapWidth-1;
        return;
    } else if (newPos.x >= Games[this.gameid].mapWidth) {
        this.direction = 1;
        this.posX = 1;
        return;
    }


    if(oldPos.x % 1 == 0 && oldPos.y % 1 == 0) {
        switch(oldDirection) {
            case 0:
                if(Games[this.gameid].usedMap[oldPos.x][Math.floor(oldPos.y-0.25)] == 0){
                    while(this.direction == oldDirection || this.direction == (oldDirection +2 )%4){
                        randomValue = Math.floor(Math.random()*2);
                        if(randomValue == 0){
                            this.direction = 1;
                        }else if (randomValue == 1) {
                            this.direction = 3;
                        }
                    }
                    return;
                }
                break;
            case 1:
                if(Games[this.gameid].usedMap[Math.floor(oldPos.x+1.25)][Math.floor(oldPos.y)] == 0){
                    while(this.direction == oldDirection || this.direction == (oldDirection +2 )%4){
                       randomValue = Math.floor(Math.random()*2);
                       if(randomValue == 0){
                            this.direction = 0;
                        }else if (randomValue == 1) {
                            this.direction = 2;
                        }
                    }
                    return;
                }
                break;
            case 2:
                if(Games[this.gameid].usedMap[oldPos.x][Math.floor(oldPos.y+1.25)] == 0){
                    while(this.direction == oldDirection || this.direction == (oldDirection +2 )%4){
                        randomValue = Math.floor(Math.random()*2);
                        if(randomValue == 0){
                            this.direction = 1;
                        }else if (randomValue == 1) {
                            this.direction = 3;
                        }
                    }
                    return;
                }
                break;
            case 3:
                if(Games[this.gameid].usedMap[Math.floor(oldPos.x-0.25)][Math.floor(oldPos.y)] == 0){
                    randomValue = Math.floor(Math.random()*2);
                   if(randomValue == 0){
                        this.direction = 0;
                    }else if (randomValue == 1) {
                        this.direction = 2;
                    }
                    return;
                }
                break;
            default:
                this.direction  = oldDirection;
                return;
        }
    }else if(newPos.x % 1 == 0 && newPos.y % 1 == 0) {
        var neighbours = [];
        neighbours.push(Games[this.gameid].usedMap[newPos.x][newPos.y-1]);
        neighbours.push(Games[this.gameid].usedMap[newPos.x+1][newPos.y]);
        neighbours.push(Games[this.gameid].usedMap[newPos.x][newPos.y+1]);
        neighbours.push(Games[this.gameid].usedMap[newPos.x-1][newPos.y]);
        if(this.direction == 0 || this.direction ==2) {
            if(neighbours[1] != 0 && neighbours[3] !=0 && neighbours[1] != 2 && neighbours[3] !=2) {
                randomValue = Math.floor(Math.random()*3);
                if(randomValue == 0){
                    this.direction = 1;
                }else if (randomValue == 1){
                    this.direction = 3;
                } else {
                    this.direction = oldDirection;
                } 
            } else if(neighbours[1] != 0 && neighbours[1] != 2){
                if(neighbours[this.direction] == 0){
                    this.direction = 1;
                } else {
                    randomValue = Math.floor(Math.random()*2);
                    if(randomValue == 0){
                        this.direction = 1;
                    }
                }
            } else if(neighbours[3] != 0 && neighbours[3] != 2){
                if(neighbours[this.direction] == 0){
                    this.direction = 3;
                } else {
                    randomValue = Math.floor(Math.random()*2);
                    if(randomValue == 0){
                        this.direction = 3;
                    }
                }
            }
        } else if(this.direction == 1 || this.direction ==3) {
            if(neighbours[0] != 0 && neighbours[2] !=0 && neighbours[0] != 2 && neighbours[2] != 2){
                randomValue = Math.floor(Math.random()*3);
                if(randomValue == 0){
                    this.direction = 0;
                }else if (randomValue == 1) {
                    this.direction = 2;
                } else {
                    this.direction = oldDirection;
                }
            } else if(neighbours[0] != 0 && neighbours[0] != 2){
                if(neighbours[this.direction] == 0){
                    this.direction = 0;
                } else {
                    randomValue = Math.floor(Math.random()*2);
                    if(randomValue == 0){
                        this.direction = 0;
                    }
                }
            } else if(neighbours[2] != 0 && neighbours[2] != 2){
                if(neighbours[this.direction] == 0){
                    this.direction = 2;
                } else {
                    randomValue = Math.floor(Math.random()*2);
                    if(randomValue == 0){
                        this.direction = 2;
                    }
                }
            }
        }
    } 
    if(this.direction == (oldDirection+2)%4){
        this.direction = oldDirection;
        return;
    }
    switch(this.direction) {
        case 0:
            if(Games[this.gameid].usedMap[newPos.x][Math.floor(newPos.y-1)] == 2){
                this.direction = oldDirection;
            }
            break;
        case 1:
            if(Games[this.gameid].usedMap[Math.floor(newPos.x+1)][newPos.y] == 2){
                this.direction = oldDirection;
            }
            break;
        case 2:
            if(Games[this.gameid].usedMap[newPos.x][Math.floor(newPos.y+1)] == 2){
                this.direction = oldDirection;
            }
            break;
        case 3:
            if(Games[this.gameid].usedMap[Math.floor(newPos.x+1)][newPos.y] == 2){
                this.direction = oldDirection;
            }
            break;
        default:
            break;
    }
    if (this.direction != oldDirection) {
        
        log = [this.gameid, this.id, 1, this.direction]
        /*pool.connect(function(err, client, done) {
            if(err) {
                return console.error('Error #022: fetching client from pool', err);
            } else {
                client.query('INSERT INTO ghost_movement (game_id, ghost_id, ghost_actiontype, action_data) VALUES($1, $2, $3, $4)',log , function(err, result) {
                    done(err);
                    if(err) {
                        return console.error('Error #023: running query', log);
                    }
                });
            }
        });*/
    }
    this.posX = newPos.x;
    this.posY = newPos.y;
}

ClassGhost.prototype.getRandDirection = function(){
    return Math.floor(Math.random()*4);

}

ClassGhost.prototype.getRandColor = function() {
    return [Math.floor(Math.random()*155+100), Math.floor(Math.random()*100), 0];
}

function ClassPill(position,id, color) {
    this.position = position;
    this.color = color;
    this.id = id;
    this.ready = true;
}

ClassPill.prototype.eaten = function(){
    ready = false;
}

function updateGames(){
    async.eachSeries(Object.keys(Games), function (key, callback) {
        Games[key].updateGame();
        callback();
    }, function (err) {
        if (err) {
            console.error('ERROR #024: ', err);
        }
    });
}

Games = {};

setInterval(updateGames,50);

function updateOverview(){
    data = []
    Object.keys(Games).forEach(function(key) {
        g = Games[key]
        data.push({gameid: g.gameid, name: g.name, loc:g.location, map:g.mapData.file, payercount:g.players.length, maxPlayers: g.maxPlayers});
    });
    async.eachSeries(ConnectedOverviews, function (overviewId, callback) {
        io.to(overviewId).emit("runningGames", data=data);
        callback();
    }, function (err) {
        if (err) {
            console.error('ERROR #027: ', err);
        }
    });
}

setInterval(updateOverview,1000);


