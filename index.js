const express = require('express')
const fs = require('fs');
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)


// looks like костыль #6
var awaiters = []

var players = []
var lastPlayerID = 1

// Фаза процесса. Самый главный костыль
// 0 - ожидание игроков
// 1 - загрузка игры, инициализация (10 секунд)
// 2 - игра
var GAME_PHASE = 0

// регулярочки
name_test = new RegExp('^[A-Za-z ]{3,20}$')

// Ждун, костыль #3
class Awaiter {

    constructor(socketID) {
        this.socketID = socketID
        this.name = '0' // недопустимый символ => ник не введен. Костыль #7
    }

    static delete(socketID) {
        var i = 0
        awaiters.forEach((el) => {
            if (el.socketID == socketID)
            {
                awaiters.splice(i, 1)
            }
            i += 1
        })
    }

    static true_awaiters_count() {
        var true_awaiters_count = 0
        awaiters.forEach((el) => {
            if (el.name != '0') { true_awaiters_count += 1 }
        })
        return true_awaiters_count
    }
}

class Player {
    constructor(socketID) {
        this.socketID = socketID
        this.playerID = lastPlayerID
        lastPlayerID += 1
        this.field = Array(11).fill(Array(11).fill(0))
    }
}

app.use(express.static(__dirname + '/static'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})


io.on('connection', (socket) => {

    if (GAME_PHASE == 0) {
        if (awaiters.length < 2) {
            awaiters.push(new Awaiter(socket.id))
            changeAwaitersCount()
        }
        else {
            socket.emit('tooMuchAwaiters', {})
        }
        socket.on('disconnect', () => {
            Awaiter.delete(socket.id)
            changeAwaitersCount()
        })

        // сборник костылей... почему оно вообще "работает"?
        socket.on('checkNickname', (data) => {

            var test = name_test.test(data.nickname)
            socket.emit('checkNickname', {result: test})
            if (test) {
                awaiters.forEach((el) => {
                    if (el.socketID == socket.id) {
                        el.name = data.nickname
                    }
                })
            }

            if (Awaiter.true_awaiters_count() == 2) {
                // Если есть 2 ждуна и они указали имена, начинаем
                Countdown(10)
            }
        })
    }


    if (GAME_PHASE == 1) {
        players.push(new Player(socket.id))

    }
})

function Countdown(countDown) {
    if (Awaiter.true_awaiters_count() == 2) {
        awaiters.forEach((el) => {
            io.to(el.socketID).emit('countdown', countDown)
        })
        setTimeout(() => {
            countDown -= 1
            if (countDown > 0) {
                Countdown(countDown)
            }
            else {
                startGame()
            }
        }, 1000)
    }
}

function startGame() {
    console.log('game started!')
}

function changeAwaitersCount() {
    var count = awaiters.length
    io.emit('changeUsersCount', count)
}

http.listen(8000, () => {
    console.log('Server has started!')
})