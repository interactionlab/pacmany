var socket = io();
console.log(navigator.userAgent);
socket.emit("connectOverview");

socket.emit("getMaps", function(response) {
    maps = response;
    for (var i = 0; i <maps.length; i++){
        console.log(maps[i])
        var x = document.getElementById("map");
        var option = document.createElement("option");
        option.text = maps[i][0]+"/"+maps[i][1]
        x.add(option);
    }
});

socket.on("runningGames", function(data){
    var table = document.getElementById("screens").getElementsByTagName("tbody")[0];

    var rows = table.getElementsByTagName("tr").length;
    for (i = 0; i < rows - data.length; i++){
        table.deleteRow(0);
    }
    var rows = table.getElementsByTagName("tr").length;
    for (i = 0; i < data.length - rows; i++){
        table.insertRow(-1);
    }
    
    var i = 0
    for(key in data){
        var row = table.children[i];
        var cell1, cell2, cell3,  cell4,  cell5,   cell6;
        if (row.children.length > 0){
            cell1 = row.children[0];
            cell2 = row.children[1];
            cell3 = row.children[2];
            cell4 = row.children[3];
            cell5 = row.children[4];
            cell6 = row.children[5];
        } else {
            cell1 = row.insertCell(0);
            cell2 = row.insertCell(1);
            cell3 = row.insertCell(2);
            cell4 = row.insertCell(3);
            cell5 = row.insertCell(4);
            cell6 = row.insertCell(5);
        }
        c1 = '<a target="_blank" href="/screen?gameid='+data[key].gameid+'">'+ data[key] .gameid+'</a>';
        if (cell1.innerHTML != c1){
            cell1.innerHTML = c1;
            cell2.innerHTML = data[key].name;
            cell3.innerHTML = data[key].loc;
            cell4.innerHTML = data[key].map;
            cell5.innerHTML = data[key].payercount+ "/" + data[key].maxPlayers;
            cell6.innerHTML = '<button type="button" onclick="restartButton('+data[key].gameid+')" class="btn btn-danger">Restart</button><button type="button" onclick="showQRCodeButton('+data[key].gameid+')" class="btn btn-info gamelink">QRCode<span id="qrcode'+data[key].gameid+'"></span></button><button type="button" onclick="joinGame('+data[key].gameid+')" class="btn btn-success">Screen</button><button type="button" onclick="deleteButton('+data[key].gameid+')" class="btn btn-danger">Delete</button>';
        } else {
            cell5.innerHTML = data[key].payercount + "/" + data[key].maxPlayers;;
        }
        i++;
        
        
    }
});

function joinGame(gameid) {
    joinSplits = prompt ("Please enter the number of screens you need. Zero means one screen, one means two screens and so on.\nDefault opens one screen");

    if (joinSplits!= null) {
        window.open("/screen?gameid=" + gameid+"&splits="+joinSplits+"&splitscreen=0");
    } else {
        window.open("/screen?gameid=" + gameid+"&splits="+0+"&splitscreen=0");

    }

}

function restartButton(gameid) {
    //$("#overlay").css('visibility', 'visible');
    //document.getElementById("overlay").style.display = "block";
    socket.emit('restartGame', {'gameid':gameid});
};

function showQRCodeButton(gameid) {
    var x = document.getElementById("qrcode"+gameid);
    if (x.children.length == 0){
        p = ":" + port;
        if (port == 80 && location.protocol == "http"){
            p = ""
        } else if (port == 443 && location.protocol == "https"){
            p = ""
        }
        new QRCode(document.getElementById("qrcode"+gameid), location.protocol + '//' + location.hostname + p + "/controller?gameid="+ gameid);
    }
};

function deleteButton(gameid) {
    socket.emit('deleteGame',{'gameid':gameid})
}

var x;
function myButton() {
    name = document.getElementById("name").value;
    place = document.getElementById("place").value;
    map = document.getElementById("map").value;
    gamemode = document.getElementById("gamemode").value;
    splits = document.getElementById("splits").value;
    showQRCode = document.getElementById("showQRCode").checked;
    showHighScore = document.getElementById("showHighScore").checked;
    maxPlayers = document.getElementById("maxPlayers").value;
    portalPairs = document.getElementById("portalPairs").value;
    pillsPerPlayer = document.getElementById("pillsPerPlayer").value;

    if(name && place && map){
        socket.emit('createNewGame', {'name':name, 'place':place, 'map':map, 'gamemode':gamemode, 'splits' : splits, 'showQRCode' : showQRCode, 'showHighScore' : showHighScore,"maxPlayers" : maxPlayers, "portalPairs" : portalPairs, "pillsPerPlayer" : pillsPerPlayer}, function(response){
            console.log(response);
            window.open(response,"_blank");
        });
    } else {
        alert("Missing input.")
    }
}

function mapPreview () {
    /*usedMap = socket.emit("getMap",document.getElementById("map").value);
    while(!usedMap){}
    var canvas = document.getElementById("mapPreview");
    cw = canvas.width / usedMap.length
    ch = canvas.height / usedMap[0].length
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000000";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "#0000FF"
    for (var i = 0;i<usedMap.length;i++){
    for (var j = 0;j<usedMap[0].length;j++){
    if(usedMap[i][j]==0){
    ctx.fillRect(i*cw,j*ch,1*cw,1*ch);
    }
    }
    }*/
}