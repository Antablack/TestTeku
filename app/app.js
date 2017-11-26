
var express = require("express");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var filesOperation = require("./filesOperation");
app.use(express.static("./public"));

http.listen(3000, function () {
    console.log('server run in port 3000');
});

io.on('connection', function (socket) {
    console.log("client conected...");
    socket.sendStatus = function (params) {
        socket.emit("status", params);
    };
    socket.sendData = function (params) {
        socket.emit("data", params);
    };
    filesOperation.operationFiles(socket).then((data)=>{
        socket.sendData(data);
    })

}) 
 








