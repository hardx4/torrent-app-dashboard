var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var http = require('http');
var osu = require('node-os-utils');
var drive = osu.drive;

require("./libs/configReader.js");
require('./libs/logger.js');

var logSystem = 'MAIN';

log('info', logSystem, 'Iniciando...');
//modulos
const mysqlWork = require("./libs/mysql-worker.js");

var app = express();
var port = config.dashboard_conf.port;
var diskspace = {};
var diskwrong = false;
var serverup = "off";

var store = {};
    store.status = {};
    store.clients = {};
    store.vpsstatus = {};
    store.lastupdate = 0;

// Allow Cross-Origin requests
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'OPTIONS, POST, GET, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

/**Serve ao usuário o arquivo de socket.io para comunicação */
app.get('/socket.io.js', function(req, res){
    res.sendFile(__dirname + '/node_modules/socket.io-client/dist/socket.io.js');
});

var time = function() {
	return Math.floor(new Date() / 1000);
};

function checkdisks(){
    drive.info()
    .then(info => {        
        store.vpsstatus = info;
    })
    .catch(err => {
        diskwrong = true;
        log('info', logSystem, "ERRO: Não foram encontrados discos no OS.");
    });
}
checkdisks();
setTimeout(() => {
    if(diskwrong){
        return ;
    } 
    checkdisks();
},60000);

var server = http.createServer(app);
var io = require('socket.io-client');
var iobrowser = require('socket.io')(server);
const socket = io.connect('http://localhost:'+config.server_conf.port+'/serverdashboard', {reconnect: true});

// Add a connect listener
socket.on('connect', function(data) { 
    serverup = "on";
    log('info', logSystem, 'Conectado!');
});

socket.on('disconnect', function(data) { 
    serverup = "off";
    log('info', logSystem, 'Disconectado!');
});

var clientside = iobrowser
    .of('/clientdashboard')
    .on('connection', function(socket){
        socket.on('getstatus', function(fn){            
            fn(JSON.stringify(store));          
        });
    });

var interval = setInterval(() => {
    if(serverup == "on"){
        socket.emit('getstatus', function (data) {
            store.status = JSON.parse(data);
            store.lastupdate = time();        
        });
        socket.emit('getclientcount', function (data) {
            store.clients = JSON.parse(data);
            store.lastupdate = time();        
        });
    }    
}, 5000);

server.listen(port, function() {
    log('info', logSystem, 'Listening on http://127.0.0.1:' + port);
});