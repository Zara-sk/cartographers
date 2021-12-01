const play_field = document.querySelector('#field')


const VILLAGE_CELL_TYPE  = "cell-village"
const FIELD_CELL_TYPE    = "cell-field"
const MONSTER_CELL_TYPE  = "cell-monster"
const MOUNTAIN_CELL_TYPE = "cell-mountain"
const FOREST_CELL_TYPE   = "cell-forest"
const SEA_CELL_TYPE      = "cell-sea"
const APROVED_CELL_TYPES = [VILLAGE_CELL_TYPE, FIELD_CELL_TYPE, MONSTER_CELL_TYPE, MOUNTAIN_CELL_TYPE, FOREST_CELL_TYPE, SEA_CELL_TYPE]

const CHOICE_CELL_TYPE = "cell-choice"
const CHOSEN_CELL_TYPE = "cell-chosen"
const ERROR_CELL_TYPE  = "cell-error"
const HELP_CELL_TYPES  = [CHOICE_CELL_TYPE, CHOSEN_CELL_TYPE, ERROR_CELL_TYPE]


const POINT_FIGURE_TYPE    = []
const CROSS_FIGURE_TYPE  = [[-1, 0], [1, 0], [0, -1], [0, 1]]
const ANGLE_FIGURE_TYPE  = [[-1, 0], [0, -1]]
const LINE_FIGURE_TYPE   = []
const SQUARE_FIGURE_TYPE = []



$(document).ready(() => {

    var frame = document.createElement("div")
    frame.id = "frame"
    frame.style["z-index"] = 1
    field.appendChild(frame)

    var r_frame = document.createElement("div")
    r_frame.id = "rframe"
    r_frame.style["z-index"] = 2
    field.appendChild(r_frame)

    var t_frame = document.createElement("div")
    t_frame.id = "tframe"
    t_frame.style["z-index"] = 2
    field.appendChild(t_frame)

    var l_frame = document.createElement("div")
    l_frame.id = "lframe"
    l_frame.style["z-index"] = 2
    field.appendChild(l_frame)

    var b_frame = document.createElement("div")
    b_frame.id = "bframe"
    b_frame.style["z-index"] = 2
    field.appendChild(b_frame)


    for (var i = 0; i < 11; i++) {
        for (var j = 0; j < 11; j++) {

            var x_pos = 15 + i*65
            var y_pos = 15 + j*65

            var new_cell = document.createElement("div")

            new_cell.classList.add("cell")
            new_cell.style.height = 65
            new_cell.style.width = 65

            new_cell.style.left = x_pos
            new_cell.style.top = y_pos
            new_cell.id = 'c' + i + '_' + j

            new_cell.style.position = "absolute"
            new_cell.style["z-index"] = 1

            field.appendChild(new_cell)
        }
    };
    
    document.querySelector("#c3_1").classList.add("cell-mountain")
    document.querySelector('#c8_2').classList.add("cell-mountain")
    document.querySelector('#c2_8').classList.add("cell-mountain")
    document.querySelector('#c5_5').classList.add("cell-mountain")
    document.querySelector('#c7_9').classList.add("cell-mountain")
})

$(document).ready(function(){

    var CHOSEN_FIGURE = CROSS_FIGURE_TYPE
    var CHOSEN_CELL   = FOREST_CELL_TYPE

    $('.cell').hover(
        function() {
            var id = $( this )[0].id
            draw_figure(CHOSEN_FIGURE, parseID(id), CHOICE_CELL_TYPE)

        }, function() {
            var id = $( this )[0].id
            clear_figure(CHOSEN_FIGURE, parseID(id))
        }
    )

    $('.cell').click(
        function() {
            var id = $( this )[0].id
            draw_figure(CHOSEN_FIGURE, parseID(id), CHOSEN_CELL)
        }
    );
});


function strID(id) {return 'c' + id[0] + '_' + id[1]}

function parseID(str) {
    var str_id = str.split('c')[1].split('_')
    var id = [parseInt(str_id[0]), parseInt(str_id[1])]
    return id
}

function contains(arr, elem) {
    return jQuery.inArray(elem, arr) != -1;
}

// Переводит массив относительных координат
// в массив абсолютных координат клеток фигуры
function parseFigureOnField(figure, cell) {
    var abs_figure = []
    for (figure_cell in figure) {
        abs_cell = [figure[figure_cell][0] + cell[0], figure[figure_cell][1] + cell[1]]
        abs_figure.push(abs_cell)
    }
    return abs_figure
}

// Проверка на то, что ни один элемент
// фигуры не лежит на другом и не заходит
// за край карты
function figure_check(figure) {
    for(cell_index in figure) {

        cell = figure[cell_index]
        if ((0 > cell[0]) || (cell[0] > 10) || (0 > cell[1]) || (cell[1] > 10)) {
            return false
        }
        cell_id = '#' + strID(cell)
        cell_class_list = document.querySelector(cell_id).classList
        for (cell_type_index in APROVED_CELL_TYPES) {
            if (cell_class_list.contains(APROVED_CELL_TYPES[cell_type_index])) {
                return false
            }
        }
    }
    return true
}

function draw_figure(figure, cell, cell_type) {

    var abs_figure = parseFigureOnField(figure, cell)
    abs_figure.push(cell)
    valid_figure_location = figure_check(abs_figure)

    // if (contains(APROVED_CELL_TYPES, cell_type) != -1) {

    // }

    // else if (contains(HELP_CELL_TYPES, cell_type) != -1) {

    // }

    // else {
    //     throw Error
    // }

    try {
        for (figure_cell_index in abs_figure) {

            figure_cell = abs_figure[figure_cell_index]
            figure_cell_id = '#' + strID(figure_cell)

            document.querySelector('#' + strID(figure_cell)).classList.add(cell_type)
        }
    }
    catch {
        for (figure_cell_index in abs_figure) {

            figure_cell = abs_figure[figure_cell_index]

            if (0 <= figure_cell[0] && figure_cell[0] <= 10 && 0 <= figure_cell[1] && figure_cell[1] <= 10) {
                document.querySelector('#' + strID(figure_cell)).classList.add("cell-error")
            }
        }
    }
}

function clear_figure(figure, cell) {

    var abs_figure = parseFigureOnField(figure, cell)
    abs_figure.push(cell)

    for (figure_cell_index in abs_figure) {

        figure_cell = abs_figure[figure_cell_index]

        if (0 <= figure_cell[0] && figure_cell[0] <= 10 && 0 <= figure_cell[1] && figure_cell[1] <= 10) {
            document.querySelector('#' + strID(figure_cell)).classList.remove('cell-choice')
            document.querySelector('#' + strID(figure_cell)).classList.remove('cell-chosen')
            document.querySelector('#' + strID(figure_cell)).classList.remove('cell-error')
        }
    }
}