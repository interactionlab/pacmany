var express = require('express');
var router = express.Router();
var ip = require("ip");

var GAME_CONFIG = require('../config.json');

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

/* GET home page. */
router.get('/', function (req, res, next) {
    query = res.req.query;
 
    if (query.gameid != null && query.gameid != "" && Games[query.gameid] != null){
        var splits = query.splits;
        if (splits == null || splits == "")
            splits = 0;
        else 
            splits = parseInt(splits);
        
        if (splits < 0)
            splits = 0;
        var splitscreen = query.splitscreen;
        if (splitscreen == null || splitscreen == "")
            splitscreen = 0;
        else 
            splitscreen = parseInt(splitscreen);
       
        if (splitscreen > splits){
            splitscreen = 0
        }       
        
        console.log(Games[query.gameid].showHighScore);
        console.log(Games[query.gameid].showQRCode);
        
        console.log("MAP " + Games[query.gameid].mapData.file);
        console.log(ip.address());
        res.render('screen', {hostip: ip.address(), hostport : GAME_CONFIG.CONFIG_PORT, map : Games[query.gameid].mapData.file,
        gameid : query.gameid, screenid : guid(), showHighScore: Games[query.gameid].showHighScore, showQRCode : Games[query.gameid].showQRCode, splits : splits, splitscreen : splitscreen});
    } else {
        res.redirect('/');
    }
});

module.exports = router;

