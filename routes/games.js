var express = require('express');
var router = express.Router();
var glob = require("glob");
var GAME_CONFIG = require('../config.json');

/* GET home page. */
router.get('/', function (req, res, next) {
    var maps = [];
    glob("public/maps/*.js", function (er, files) {
        for (var i = 0; i<files.length; i++){
            maps.push(files[i].split(".")[0].split("/")[files[i].split("/").length-1].replace("map_", "").replace("_", "/"));
        }
        res.render('games', {mapoptions : maps, gamemodes: GAME_CONFIG.GAME_MODES, port : GAME_CONFIG.CONFIG_PORT});
    });
});

module.exports = router;

