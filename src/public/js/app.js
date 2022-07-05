//Page에 뿌려질 내용들 처리 
//Browser 기능이라고 할까
//html 관련은 home.pug에 

const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

//미디어와 관련된 요소 묶음
const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
//연결객체
let myPeerConnection;

//모든 카메라 가져오기
async function getCameras(){
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind == "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        //실제 카메라를 제어할 때 필요한 것은 camera.deviceId
        cameras.forEach((camera)=>{
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label == camera.label){
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        });
    }catch(e){
        console.log(e);
    }
}

//getUserMedia 메소드를 통한 스트림 반환은 비동기적 처리이므로
//async-await로 처리 
async function getMedia(deviceId){
    //제약->요청할 미디어 유형 각각에 대한 요구사항을 지정하는 객체
    //기본 디폴트 설정은 전면카메라
    const initialConstraints = {
        audio: true,
        video: { facingMode : "user" },
    };
    const cameraConstraints = {
        audio: true,
        video: {deviceId: {exact: deviceId}},
    }
    
    try{
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstraints: initialConstraints
        );
        //스트림으로 받아온 영상을 myFace에 넣는다
        myFace.srcObject = myStream;
        //select에서 선택할 때마다 반복해서 메뉴 추가되던 현상 해결
        if(!deviceId){
            await getCameras();
        }
    } catch(e){
        console.log(e);
    }
}

function handleMuteClick(){
    
    myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));

    if(!muted){
        muteBtn.innerText = "Unmute";
        muted = true;
    }else{
        muteBtn.innerText = "Mute";
        muted = false;
    }
}

function handleCameraClick(){

    myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));

    if(!cameraOff){
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }else{
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    }
}

//카메라 변경
async function handleCameraChange(){
    await getMedia(camerasSelect.value);
    if(myPeerConnection){
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
        .getSenders()
        .find((sender) => sender.track.kind==="video");
        videoSender.replaceTrack(videoTrack);
    }
}


muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
//input => 입력값이 변경될때 동작
camerasSelect.addEventListener("input", handleCameraChange);

//Welcome Form ( join a room )

async function initCall(){
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

async function handleWelcomeSubmit(event){
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join_room", input.value);
    roomName = input.value;
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

//Socket Code

//offer를 보내는 쪽에서 이벤트 핸들링
socket.on("welcome", async ()=>{
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);    
    socket.emit("offer", offer, roomName);
})
//offer를 받는 쪽에서 이벤트 핸들링
socket.on("offer", async(offer) => {
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
})

socket.on("answer", answer => {
    myPeerConnection.setRemoteDescription(answer);
})

socket.on("ice", ice => {
    myPeerConnection.addIceCandidate(ice);
});

//RTC Code

function makeConnection(){
    //서로 접속한 와이파이가 다르던가 그러면 동작을 안해서 stun 서버가 필요
    //stun 서버는 기기들이 공용 ip주소를 찾게해준다
    //구글 무료 stun 서버 사용 => 실 상용화할때는 만들어야함
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
                {   
                    urls:[
                        "stun:stun.l.google.com:19302",
                        "stun:stun1.l.google.com:19302",
                        "stun:stun2.l.google.com:19302",
                        "stun:stun3.l.google.com:19302",
                        "stun:stun4.l.google.com:19302",
                    ]
                }
        ]
    });

    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream
        .getTracks()
        .forEach(track => myPeerConnection.addTrack(track, myStream))
}

function handleIce(data){
    console.log("send icecandidate");
    socket.emit("ice", data.candidate, roomName);
    
}

function handleAddStream(data){
    const peerFace1 = document.getElementById("peerFace");
    peerFace1.srcObject = data.stream;
}