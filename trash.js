var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(5000, function() {
  console.log('Starting server on port 5000');
});


let box = 22;
let food = {
x: Math.floor((Math.random() * 32)) * 22 +11,
y: Math.floor((Math.random() * 32)) * 22 -11,
};
var players = {};
io.on('connection', function(socket) {
  socket.emit('eda', food);
  socket.on('new player', function() {

    players[socket.id] = [{x: 66,y: 22}];

    players[socket.id].push({x: 0,y: 0});
  }

  socket.on('movement', function(data) {
    var player = players[socket.id] || {};
    var a = 0 ;
    for (a ; a > 0;  a--){
      player[a].x = player[a-1].x
      player[a].y = player[a-1].y
    }




  });

});



 setInterval(function() {
   io.sockets.emit('state', players);
}, 1000 / 60);