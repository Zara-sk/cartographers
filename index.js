const express = require('express')
const fs = require('fs');
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)

app.use(express.static(__dirname + '/static'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/playground.html')
})


http.listen(8000, () => {
    console.log('Server has started!')
})