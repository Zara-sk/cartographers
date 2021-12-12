const socket = io()

counterObj = document.querySelector('#counter')
nickObj = document.querySelector('#nickname')
submitObj = document.querySelector('#submit')
form = document.querySelector('#name-block')
awaiter = document.querySelector('#awaiter')

socket.on('changeUsersCount', (newCount) => {
    counterObj.innerHTML = 'Картографы: ' + newCount + ' / 2'
})

socket.on('checkNickname', (data) => {
    if (data.result) {
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

socket.on('tooMuchAwaiters', (data) => {
    awaiter.innerHTML = 'Слишком много картографов =(<br>Попробуйте перезагрузить страничку. Вдруг, кто-то забоялся'
})

socket.on('countdown', (countDown) => {
    counterObj.innerHTML = 'Начало через ' + countDown
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
        socket.emit('checkNickname', {
            nickname: nickObj.value
        })
    }
})