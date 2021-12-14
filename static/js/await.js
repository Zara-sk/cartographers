const socket = io()

counterObj = document.querySelector('#counter')
nickObj = document.querySelector('#nickname')
submitObj = document.querySelector('#submit')
form = document.querySelector('#name-block')
awaiter = document.querySelector('#awaiter')

socket.on('actualInfo', (data) => {
    console.log(data)
    if (data.status == 'ready') {
        awaiter.style.opacity = 1
        counterObj.innerHTML = 'Картографы: ' + data.count + ' / 2'
    }
    else if (data.status == 'in_queue') {
        awaiter.style.opacity = 0
        counterObj.innerHTML = 'Слишком много картографов =(<br>Подождите, вдруг, кто-то испугается и сбежит...'
    }
})

socket.on('approveName', (result) => {
    console.log(result)
    if (result) {
        nickObj.style.backgroundColor = '#eee'
        nickObj.readOnly = true
        submitObj.style.opacity = 0
        setTimeout(() => {
            submitObj.style.width = '0px'
            nickObj.style.fontSize = '40px'
        }, 1000)
    }
    else {
        nickObj.style.backgroundColor = '#f77'
    }
})

socket.on('go', (data) => {
    document.location.href = document.location.href + 'game' + '?key=' + data.key + '&' + '&name=' + data.name
})

socket.on('countdown', (number) => {
    console.log(number)
    counterObj.innerHTML = 'Начало через ' + number
})


// Локальная валидация никнейма
$('#nickname').keypress((e) => {
    nickObj.style.backgroundColor = '#eee'
    var regex = new RegExp("^[a-zA-Z ]{0,20}$");
    var str = String.fromCharCode(!e.charCode ? e.which : e.charCode);
    if (regex.test(str)) {
        return true;
    }
    e.preventDefault();
    return false;
});

form.addEventListener('submit', (e) => {
    if (nickObj.value) {
    console.log('event')
        socket.emit('approveName', nickObj.value)
    }
})