var express = require('express');
var router = express.Router();

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

router.get('/', function (req, res, next) {
    query = res.req.query;
    if (query.gameid != null && query.gameid != "" && Games[query.gameid] != null){
        res.render('controller', {gameid : query.gameid, controllerid : guid()});
    } else {
        res.redirect('/');
    }
});

module.exports = router;

