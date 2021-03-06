var GHOST_COUNT = 10;
var MAX_NUMBER_OF_EATEN = 182;
var POSITIONS_USERS = [{"x": 90, "y": 120}, {"x": 250, "y": 120}]
var POSITIONS_GHOSTS = [{"x": 9, "y": 9},{"x": 9, "y": 27}]
var TUNNEL_POS = 140;

var GHOST_START_DIRECTION = 3;

var URL_POSITION = {"x": 16, "y": 12.5};
var URL_SIZE = 0.55;
var URL_LINE_DISTANCE = 0.5;

var URL_PARAM1 = 1;
var URL_PARAM2 = 5;
var URL_PARAM3 = 1.2;

var TOTAL_LIFE_COUNT = 2;


var mapOriginal = [[0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,1,1,1,1,0],
[0,4,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,4,0,4,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,4,0,1,0,1,0,0,1,0,1,0,1,0,0,0,0,1,0],
[0,1,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,1,0,1,1,1,0,0,1,0,1,0,1,0,0,0,0,1,0],
[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,0,0,1,0,1,0,4,1,1,1,1,1,0],
[0,1,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,1,0,1,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,1,0,1,1,1,0,0,1,0,1,0,0,0,0,0,0,1,0],
[0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,0,0,1,0],
[0,1,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,1,0,1,0,1,0,0,1,0],
[0,1,1,1,1,0,1,1,1,1,1,1,1,0,1,0,2,2,2,2,2,0,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,0,1,0,1,0,1,0,0,1,0],
[0,1,0,0,1,0,1,0,0,2,0,0,1,0,1,0,0,0,0,0,0,0,1,0,1,0,0,2,0,0,1,0,1,0,0,0,0,1,0,1,0,0,1,1,1,0,1,0,1,0,0,1,0],
[0,1,1,1,1,1,1,0,2,2,2,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,2,2,2,0,1,1,1,0,1,1,1,1,0,1,1,1,1,0,1,1,1,0,1,1,1,1,0],
[0,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,1,0,0,1,0,0,0,0,1,0,1,0,1,0,1,0,0,0,0],
[2,2,2,0,1,0,1,1,1,1,1,1,1,0,1,0,2,2,2,2,2,0,1,0,1,1,1,1,1,1,1,0,1,0,1,0,0,1,1,1,1,1,1,1,1,0,1,0,1,0,2,2,2],
[0,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,1,0,0,1,0,0,0,1,0,0,1,0,1,1,1,0,0,0,0],
[2,2,2,2,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,0,0,0,1,2,2,2,2],
[0,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,1,0,1,0,1,0,1,1,1,1,0,1,1,1,0,0,0,0],
[2,2,2,0,1,1,1,1,1,1,1,1,1,1,1,0,1,4,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,4,0,1,0,1,0,1,0,0,1,0,1,0,1,0,2,2,2],
[0,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,1,0,0,0,1,0,1,0,1,0,0,0,0,0,1,0,1,0,1,0,0,1,0,1,0,1,0,0,1,0,1,0,1,0,0,0,0],
[0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0,1,1,1,0,1,1,1,1,0,1,0,1,1,1,1,0],
[0,1,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0],
[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0],
[0,1,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,1,0,1,0,1,0,1,0],
[0,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,0,0,1,0,1,0,1,0,1,0],
[0,1,1,1,1,1,1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,1,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
[0,1,0,0,0,0,1,0,2,2,2,2,2,0,1,1,1,1,1,1,1,1,1,0,4,1,0,1,1,1,1,1,1,1,1,1,1,1,0,0,4,0,0,1,0,0,0,0,0,0,0,1,0],
[0,1,1,1,4,1,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1,0,1,0,1,0,0,0,0,0,1,0,1,0,0,1,0,0,1,0,2,0,1,1,1,1,1,0],
[0,1,0,0,0,0,1,1,1,1,1,1,1,1,1,0,2,2,2,2,2,0,1,0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0,0,1,0,2,0,4,0,0,0,1,0],
[0,1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0,0,1,0,0,0,1,0,0,0,1,0],
[0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
[0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];

if (typeof exports !== 'undefined') {
    exports.mapData = function() {
        return data = {"usedMap":mapOriginal,"POSITIONS_GHOSTS":POSITIONS_GHOSTS,"GHOST_COUNT":GHOST_COUNT, "file":"map_30_53.js","GHOST_START_DIRECTION":GHOST_START_DIRECTION}
    }
}