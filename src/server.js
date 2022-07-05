import http from "http";
import {Server} from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import express from "express";

const app = express ();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

//app.listen(3000, handleListen);

const httpServer = http.createServer(app);

const wsServer = new Server(httpServer, {
    cors:{
        //데모 주소
        origin: ["https://admin.socket.io"],
        credentials: true
    }
});

instrument(wsServer, {
    auth: false
});

//공용 채팅룸 이름 얻어오기
function publicRooms(){
    //연결된 소켓 id들 가져오고
    //const sids = wsServer.sockets.adapter.sids;
    //만들어져 있는 채팅 룸들 가져오고
    //const rooms = wsServer.sockets.adapter.rooms;
    //아래는 구조 분해 할당 
    const {
        sockets:{
            adapter:{sids,rooms},
        },
    } = wsServer;
    
    const publicRooms = [];
    //rooms의 key중에서 sids의 어떤 키와도 일치하지 않는 것들을 publicRooms 배열에 추가
    //sids의 키와 일치하지 않는다 = 공용 채팅방이다 
    //배열의 forEach는 호출할때마다 인덱스번호와 배열의 요소를 인자로 전달
    //Map의 forEach는 호출할때마다 value, key를 인자로 전달
    //우리는 key만 사용하니까 아래처럼 변경
    //rooms.forEach( (value, key) => {
    rooms.forEach( (_, key) => {
        if(sids.get(key) == undefined){
            publicRooms.push(key)
        }
    })
    return publicRooms;
}

//채팅룸 인원 얻기
function countRoom(roomName){
    // ? 연산자로 채팅룸이 있을때만 size를 얻어온다
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
    //닉네임 입력전까지 임시 처리
    socket["nickname"] = "Anon";
    //socket 모든 이벤트 핸들러 등록
    socket.onAny( (event) =>{
        console.log(wsServer.sockets.adapter);
        console.log(`Socket Event: ${event}`);
    });


    //on은 이벤트핸들링 메서드
    //socket.on("enter_room", (roomName) => console.log(roomName));
    socket.on("enter_room", (roomName, nickname, done)=>{
        done();
        socket.join(roomName);
        socket["nickname"] = nickname;
        //roomName을 대상으로 지정
        //emit이 호출되면 해당 룸에 참가한 소켓들에 대해서만 이벤트가 발생
        //이벤트명은 welcome
        //socket.to(roomName).emit("welcome");
        //emit으로 welcome 함수에 nickname 전달
        socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
        //publicRooms()에서 반환되는 모든 채팅룸의 배열
        wsServer.sockets.emit("room_change", publicRooms());
    });

    //연결이 완전히 해제되기 직전 발생하는 이벤트
    socket.on("disconnecting", () => {
        socket.rooms.forEach( (room) => 
            socket.to(room).emit("bye", socket.nickname, countRoom(room)-1));
    });
    //연결이 완전히 해제되었을때 발생하는 이벤트
    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());
    });

    socket.on("new_message", (msg, room, done) =>{
        //socket.to(room).emit("new_message", msg);
        //메시지 입력시 입력한 사람 닉네임과 메세지 전달
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    });
    
    //socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
});

const handleListen = () => console.log("Listening on http://localhost:3000");
httpServer.listen(3000, handleListen);