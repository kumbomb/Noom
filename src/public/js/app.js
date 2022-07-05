//Page에 뿌려질 내용들 처리 
//Browser 기능이라고 할까
//html 관련은 home.pug에 

const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");

let myStream;
let muted = false;
let cameraOff = false;

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
            cameraSelect.appendChild(option);
        })
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
        video: { facingMode : "user" }
    };
    const cameraConstraints = {
        audio: true,
        video: {deviceId: {exact: deviceId}}
    };
    
    try{
        myStream = await navigator.mediaDevices.getUserMedia(
           deviceId ? cameraConstraints: initialConstraints
        );
        //스트림으로 받아온 영상을 myFace에 넣는다
        myFace.srcObject = myStream;
        //select에서 선택할 때마다 반복해서 메뉴 추가되던 현상 해결
        if(!deviceId)
            await getCameras();
    } catch(e){
        console.log(e);
    }
}

getMedia();

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

    myStream.getVideoTracks().forEach((track) => (track.enabled = ! track.enabled));

    if(!cameraOff){
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }else{
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    }
}

//카메라 변경
function handleCameraChange(){
    await getMedia(cameraSelect.value);
}


muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
//input => 입력값이 변경될때 동작
cameraSelect.addEventListner("input", handleCameraChange);