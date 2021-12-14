const express = require('express')
const fs = require('fs');
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)

var awaiters = []
var names = []
var awaiters_queue = []

var players = []

// Фаза процесса. Самый главный костыль
// 0 - ожидание игроков
// 1 - загрузка игры, инициализация (10 секунд)
// 2 - игра
// 3 - конец игры => перезагрузка
var GAME_PARAMS = {phase: 0, idInterval: -1}

// регулярочка
name_test = new RegExp('^[A-Za-z ]{3,20}$')

const VILLAGE_CELL_TYPE  = "cell-village"
const FIELD_CELL_TYPE    = "cell-field"
const MONSTER_CELL_TYPE  = "cell-monster"
const MOUNTAIN_CELL_TYPE = "cell-mountain"
const FOREST_CELL_TYPE   = "cell-forest"
const SEA_CELL_TYPE      = "cell-sea"
const APROVED_CELL_TYPES = [VILLAGE_CELL_TYPE, FIELD_CELL_TYPE, FOREST_CELL_TYPE, SEA_CELL_TYPE]

const POINT_FIGURE_TYPE  = []
const CROSS_FIGURE_TYPE  = [[-1, 0], [1, 0], [0, -1], [0, 1]]
const ANGLE_FIGURE_TYPE  = [[-1, 0], [0, -1]]
const LINE_FIGURE_TYPE   = [[-1, 0], [1, 0]]
const SQUARE_FIGURE_TYPE = [[-1, 0], [-1, -1], [0, -1]]
const ALL_FIGURES = [POINT_FIGURE_TYPE, CROSS_FIGURE_TYPE, ANGLE_FIGURE_TYPE, LINE_FIGURE_TYPE, SQUARE_FIGURE_TYPE]


class Awaiter {
// Ждун.
// Либо один из двух потенциальных игроков <awaiters>,
// либо в очереди <awaiters_queue>, если кто-то выйдет

    constructor(socketID) {
        this.socketID = socketID
        this.name = 'n0name'
    }

    static add(socketID) {
        var awaiter = new Awaiter(socketID)
        if (awaiters.length < 2) {
            awaiters.push(awaiter)
            // console.log('+ awaiter ' + socketID + ' count: ' + awaiters.length + ' q_count: ' + awaiters_queue.length)
        }
        else {
            awaiters_queue.push(awaiter)
            // console.log('+ q_awaiter ' + socketID + ' count: ' + awaiters.length + ' q_count: ' + awaiters_queue.length)
        }
        Awaiter.sendActualInfo()
    }

    static delete(socketID) {
        var flag = true
        for (var i = 0; i < awaiters.length; i++) {
            if (awaiters[i].socketID == socketID) {
                awaiters.splice(i, 1)
                var flag = false
                Awaiter.move_queue()
                // console.log('- awaiter ' + socketID + ' count: ' + awaiters.length + ' q_count: ' + awaiters_queue.length)
            }
        }
        if (flag) {
            for (var i = 0; i < awaiters_queue.length; i++) {
                if (awaiters_queue[i].socketID == socketID) {
                    awaiters_queue.splice(i, 1)
                    // console.log('- q_awaiter ' + socketID + ' count: ' + awaiters.length + ' q_count: ' + awaiters_queue.length)
                }
            }
        }
        Awaiter.sendActualInfo()
    }

    static get_by_socketID(socketID) {
        awaiters.forEach((el) => {
            if (el.socketID == socketID) {
                return el
            } 
        })
        return -1
    }

    static move_queue() {
        if (awaiters_queue.length > 0) {
            awaiters.push(awaiters_queue.shift())
            // console.log('- awaiter + q_awaiter ' + awaiters[awaiters.length-1].socketID + ' count: ' + awaiters.length + ' q_count: ' + awaiters_queue.length)
        }
        Awaiter.sendActualInfo()
    }

    static named_awaiters_count() {
        var count = 0
        awaiters.forEach((el) => {
            if (el.name != 'n0name') { count++ }
        })
        return count
    }

    static emitAwaiters(event, data) {
        awaiters.forEach((el) => {
            io.to(el.socketID).emit(event, data)
        })
    }

    static sendActualInfo() {
        awaiters.forEach((el) => {
            io.to(el.socketID).emit('actualInfo', {
                status: 'ready',
                count: awaiters.length
            })
        })
        awaiters_queue.forEach((el) => {
            io.to(el.socketID).emit('actualInfo', {
                status: 'in_queue'
            })
        })
    }

}


class Player {
    // Игрок, один из двух в <players>

    constructor(name) {
        this.socketID = 0
        this.name = name
        this.score = 0
    }

    static add(name) {
        var player = new Player(name)
        players.push(player)
    }

    static getByID(socketID) {
        players.forEach((el) => {
            if (el.socketID == socketID) {
                console.log(el)
                return el
            }
        })
    }

    static reconnect(socketID, name) {
        // разумеется, не лучшая идея идентификатором ставить поле имени...
        // представим, что больше никто не имеет ключ игры и не знает имен...
        players.forEach((el) => {
            if (el.name == name) { el.socketID = socketID }
        })
    }

    static emitStartInfo() {
        io.to(players[0].socketID).emit('startinfo', {name: players[1].name})
        io.to(players[1].socketID).emit('startinfo', {name: players[0].name})
    }

    static emitToOpponent(socketID, data) {
        var opponentID = null
        if (players[0].socketID == socketID) { opponentID = players[1].socketID }
        else { opponentID = players[0].socketID }
        io.to(opponentID).emit(data.event, data)
    }

    static upscore(socketID, data) {
        var player = null
        players.forEach((el) => {
            if (el.socketID == socketID) {
                player = el
            }
        })
        player.score = player.score + data.number
        Player.emitToOpponent(socketID, {
            event: 'upopscore',
            score: player.score
        })
        io.to(socketID).emit('upscore', player.score)
    }

    static connectedCount() {
        var count = 0
        players.forEach((el) => {
            if (el.socketID != 0) {count++}
        })
        return count
    }
}

function contains(arr, elem) {
    return arr.indexOf(elem) != -1;
}

// Без сильных костылей не обошлось
var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
function generateGameKey() {
    var key = ""
    for (var i = 0; i < 10; i++) { key += possible.charAt(Math.floor(Math.random() * possible.length)) }
    return key
}



app.use(express.static(__dirname + '/static'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.get('/game', (req, res) => {
    var game_key = req.query.key
    var name = req.query.name
    if (game_key == GAME_PARAMS.key) {
        Player.add(name)
        res.sendFile(__dirname + '/playground.html')
    }
})

io.on('connection', (socket) => {

    if (GAME_PARAMS.phase == 0 || GAME_PARAMS.phase == 1) {
        Awaiter.add(socket.id)

        socket.on('approveName', (name) => {
            // console.log('game ' + GAME_PARAMS.phase)

            var test_result = (name_test.test(name)) && (!contains(names, name))
            if (players.length > 0) { test_result = false }
            if (test_result) {
                awaiters.forEach((el) => {
                    if (el.socketID == socket.id) {
                        el.name = name
                        names.push(name)
                    }
                })
            }
            socket.emit('approveName', test_result)

            if (Awaiter.named_awaiters_count() == 2) {
                GAME_PARAMS.phase = 1
                Countdown(10)
            }

        })

        socket.on('disconnect', () => {
            Awaiter.delete(socket.id)
        })
    }

    if (GAME_PARAMS.phase == 2) {

        socket.on('connectme', (name) => {
            Player.reconnect(socket.id, name) // ОН ТОЛЬКО ЗАХОДИТ, А МЫ ЕГО РЕКОНЕКТИМ [Назад в будущее!!!!!!!!!]
            // console.log('+ player ' + name + ' ' + socket.id)
            console.log(players)
            if (Player.connectedCount() == 2) {
                // Когда оба присоеденились, начинаем вечеринку!
                Player.emitStartInfo()
                changeFigure()
                gameInterval()
            }
        })

        socket.on('recent', (data) => {
            Player.emitToOpponent(socket.id, data)
        })

        socket.on('upscore', (number) => {
            gameInterval()
            Player.upscore(socket.id, number)
            changeFigure()
        })
    }

})

function Countdown(number) {
    if (GAME_PARAMS.phase == 1) {
        if (Awaiter.named_awaiters_count() == 2) {
            Awaiter.emitAwaiters('countdown', number)
            setTimeout(() => {
                number -= 1
                if (number > 0) { Countdown(number) }
                else { startGame() }
            }, 1000)
        }
        else {
            GAME_PARAMS.phase = 0
            Awaiter.sendActualInfo()
        }
    }
}

function startGame() {

    GAME_PARAMS.phase = 2
    GAME_PARAMS.key = generateGameKey()

    awaiters.forEach((el) => {
        io.to(el.socketID).emit('go', {
            key: GAME_PARAMS.key,
            name: el.name
        })
    })
}

function gameInterval() {

    var idInterval = GAME_PARAMS.idInterval
    if (idInterval != -1) {clearTimeout(idInterval)}

    idInterval = setTimeout(() => {
        endGame()
    }, 10000)
    GAME_PARAMS.idInterval = idInterval
}

function endGame() {
    endGame()
}

// на этом месте бобик сел, самоосуждаюсь
function endGame() {

    GAME_PARAMS.phase = 4

    var result = {}

    if (players[0].score == players[1].score) {
        result.result = 'draw'
    }

    else {
        result.result = 'win',
        maxim = Math.max(players[0].score, players[1].score)
        players.forEach((el) => {
            if (el.score == maxim) {result.winner = el.name}
        })
    }

    players.forEach((el) => {
        io.to(el.socketID).emit('endgame', result)
    })
    setTimeout(() => {
        players.pop()
        players.pop()
        GAME_PARAMS.phase = 0
    }, 10000)
}

function changeFigure() {
    var new_figure = ALL_FIGURES[Math.floor(Math.random()*ALL_FIGURES.length)]
    var new_type_cell = APROVED_CELL_TYPES[Math.floor(Math.random()*APROVED_CELL_TYPES.length)]
    players.forEach((el) => {
        io.to(el.socketID).emit('changefigure', {
            figure: new_figure,
            cell: new_type_cell
        })
    })
}

http.listen(8000, () => {
    console.log('IT WORKS!')
})