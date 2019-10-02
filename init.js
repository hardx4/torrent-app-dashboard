var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var http = require('http');
var osu = require('node-os-utils');
var drive = osu.drive;

var app = express();
var port = 5001;
var diskspace = {};
var diskwrong = false;

// Allow Cross-Origin requests
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'OPTIONS, POST, GET, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

function checkdisks(){
    drive.info()
    .then(info => {
        diskspace = info;
    })
    .catch(err => {
        diskwrong = true;
        console.log("ERRO: Não foram encontrados discos no OS.");
    });
}
checkdisks();
setTimeout(() => {if(diskwrong){return ;} checkdisks(); console.log(diskspace);},30000);

var server = http.createServer(app);
server.listen(port, function() {
    console.log('Listening on http://127.0.0.1:' + port);
});