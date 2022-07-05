//Page에 뿌려질 내용들 처리 
//Browser 기능이라고 할까
//html 관련은 home.pug에 

const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName, nickname;

function addMessage(message){
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

function handleMessageSubmit(event){
    event.preventDefault();
    //const input = room.querySelector("input");
    const input =room.querySelector("#msg input");
    const value = input.value;
    socket.emit("new_message", value, roomName, () => {
        addMessage(`You : ${value}`);
    });
    input.value ="";
}

function handleNicknameSubmit(event){
    event.preventDefault();
    const input = form.querySelector("#name input");
    const value = input.value;
    socket.emit("nickname", value);
    input.value = "";
}

function showRoom(){
    welcome.hidden = true;
    room.hidden= false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room : ${roomName}`;
    const form = room.querySelector("form");
    form.addEventListener("submit", handleMessageSubmit);
    const msgForm = room.querySelector("#msg");
    //const nameForm = room.querySelector("#name");
    msgForm.addEventListener("submit", handleMessageSubmit);
    //nameForm.addEventListener("submit", handleNicknameSubmit);
}

function handleRoomSubmit(event){
    event.preventDefault();
    const input = form.querySelector("#roomName");//formRoom.querySelector("input");
    const inputNick = form.querySelector("#name");//formNick.querySelector("input");
    //emit 이벤트를 발생
    //특징 : 이벤트명을 사용자 정의 설정 가능
    //이벤트를 통해 전송할 데이터 -> 객체가 될 수 있음
    roomName = input.value;
    nickname = inputNick.value;
    socket.emit("enter_room", input.value, inputNick.value, showRoom);
    input.value ="";
    inputNick.value ="";
}

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", (userNickname) => {
    addMessage(`${userNickname} arrived!`);
});

socket.on("bye", (userNickname) => {
    addMessage(`${userNickname} left ㅠㅠ`);
});

socket.on("new_message", (msg) =>{
    addMessage(msg);
});