import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express ();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

//app.listen(3000, handleListen);

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on("connection", (socket) => {
    //닉네임 입력전까지 임시 처리
    socket["nickname"] = "Anon";

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
        socket.to(roomName).emit("welcome", socket.nickname);
    });

    socket.on("disconnecting", () => {
        //socket.rooms.forEach(room => socket.to(room).emit("bye"));
        //emit으로 welcome 함수에 nickname 전달
        socket.rooms.forEach( (room) => 
            socket.to(room).emit("bye", socket.nickname));
    });

    socket.on("new_message", (msg, room, done) =>{
        //socket.to(room).emit("new_message", msg);
        //메시지 입력시 입력한 사람 닉네임과 메세지 전달
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    });
    
    //socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
});


// //원래라면 누가 메세지를 보내는지 파악하고 처리해야되는데 (db)
// //그게 안되니까 임시 디비처리
// const sockets = [];

// wss.on("connection", (socket) => {
//     //console.log(socket);
//     sockets.push(socket);

//     //이름 없으면 익명으로
//     socket["nickname"] = "Anonymous"    

//     console.log("Connected to Browser");
//     socket.on("close", () => console.log("Disconnected from Browser"));

//     socket.on("message", (msg) => {
//         const message = JSON.parse(msg);
//         // console.log(message.type, message.payload);
//         // sockets.forEach(aSocket => aSocket.send(`${message}`));
//         switch(message.type){
//             case "new_message":
//                 // sockets.forEach(aSocket => aSocket.send(`${message.payload}`));
//                 sockets.forEach(aSocket => aSocket.send(`${socket.nickname} : ${message.payload}`));
//                 break;
//             case "nickname":
//                 socket["nickname"] = message.payload;
//                 break;
//         }
//     });
// })

const handleListen = () => console.log("Listening on http://localhost:3000");
httpServer.listen(3000, handleListen);