var express = require('express');
var router = express.Router();
var glob = require("glob");
var GAME_CONFIG = require('../config.json');

/* GET home page. */
router.get('/', function (req, res, next) {
    var mapsDic = [];
    glob("public/maps/*.js", function (er, files) {
        for (var i = 0; i<files.length; i++){
			var mapName = files[i].split(".")[0].split("/")[files[i].split("/").length-1].replace("map_", "").replace("_", "/");
			var sizeOfMap = mapName.split("/");
            mapsDic.push({
				name: mapName,
				value: sizeOfMap[0] * sizeOfMap[1]
			});
        }
		
		var mapsSort = mapsDic.sort(function(a, b) {
		  return (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0)
		});
		
		var maps = [];
		for (var i = 0; i<mapsSort.length; i++){
			maps.push(mapsSort[i].name);
		}
		

		
        res.render('games', {mapoptions : maps, gamemodes: GAME_CONFIG.GAME_MODES, port : GAME_CONFIG.CONFIG_PORT});
    });
});

module.exports = router;

