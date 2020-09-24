//---------------------------------Event Listener-----------------------------------
var indexLink="https://achtung.herokuapp.com/";//http://localhost:3000
document.addEventListener("load",()=>{
    if(!sessionStorage.getItem("playerName")){
        window.location.href= indexLink; //heroku
    }
});
document.getElementById("reload").addEventListener("click",()=>{
    window.location.reload(true);
});

document.getElementById("playerReadyButton").addEventListener("click",playerIsReady);
document.getElementById("leftControl").addEventListener("touchstart",(e)=>{   // emulate left arrow  mousedown = touchstart
    e.preventDefault();
    if(!leftArrowDown){
        leftArrowDown=true;
        sendInputUpdate(); 
    }
});
document.getElementById("rightControl").addEventListener("touchstart",(e)=>{ // emulate right arrow  mousedown = touchstart
    e.preventDefault();
    if(!rightArrowDown){
        rightArrowDown=true;
        sendInputUpdate(); 
    }
});
document.getElementById("leftControl").addEventListener("touchend",(e)=>{ // emulate left arrow  mouseup = touchend
    e.preventDefault();
        leftArrowDown=false;
        sendInputUpdate(); 
    
});
document.getElementById("rightControl").addEventListener("touchend",(e)=>{ // emulate right arrow  mouseup = touchend
    e.preventDefault();
        rightArrowDown=false;
        sendInputUpdate(); 
    
});

document.addEventListener("keydown",(e)=>{
    console.log("test");
    if((e.keyCode==37)&&!leftArrowDown){ // leftarrow down if it wasnt down before
        leftArrowDown=true;
        sendInputUpdate();
    }else if((e.keyCode==39)&&!rightArrowDown){// right arrow down if it wasnt down before
        rightArrowDown=true;
        sendInputUpdate();
    }
});
document.addEventListener("keyup",(e)=>{
    if(e.keyCode==37){ // leftarrow
        leftArrowDown=false;
        sendInputUpdate();
    }else if(e.keyCode==39){// right arrow
        rightArrowDown=false;
        sendInputUpdate();
    }
});

//-------------------------SetUp---------------------------

const mainCanvas=document.getElementById("mainCanvas");
const mainCtx = mainCanvas.getContext('2d');

const animCanvas1=document.getElementById("animCanvas1");
const animCtx1 = animCanvas1.getContext('2d');
const animCanvas2=document.getElementById("animCanvas2");
const animCtx2 = animCanvas2.getContext('2d');

function smallestWindowSide(){
    if(window.innerHeight<window.innerWidth){
        return window.innerHeight;
    }else{
        return window.innerWidth;
    }
}
var canvasSide;
if(smallestWindowSide()>1000/0.8){
    canvasSide=1000;               // big desktop
}else if(smallestWindowSide()>500){
    canvasSide=0.8*smallestWindowSide();// smaller screens
}else{
    canvasSide=smallestWindowSide(); // mobile ... use full width
}

mainCanvas.width  = canvasSide;
mainCanvas.height = canvasSide;
//mainCanvas.style.width=canvasSide+"px";
//mainCanvas.style.height=canvasSide+"px";
mainCtx.lineCap="round";

animCanvas1.width  = canvasSide;
animCanvas1.height = canvasSide;

animCtx1.lineCap="round";

animCanvas2.width  = canvasSide;
animCanvas2.height = canvasSide;

animCtx2.lineCap="round";

let root = document.documentElement; // for variable css styles
//----------------------------Player Details--------------------------------
var playerName ="";
var yourRoom;
//----------------------------InGame info-----------------------------------
var leftArrowDown=false;
var rightArrowDown=false;

var lineWidth;


var playerSelf;
var playerOpponent;

var p1StartDrawn=false;  // were the beginning dots drawn ?
var p2StartDrawn=false;
var p1Color;
var p2Color;

function startCountDown(){
    document.getElementById("countDown").style.display="block";
    setTimeout(()=>{
        document.getElementById("countDown").innerHTML = "2";
    },1000);
    setTimeout(()=>{
        document.getElementById("countDown").innerHTML = "1";
    },2000);
    setTimeout(()=>{
        document.getElementById("countDown").innerHTML = "Go";
    },2900);
    setTimeout(()=>{
        document.getElementById("countDown").innerHTML = "3";
        document.getElementById("countDown").style.display="none";
    },3400);
}
//----------------------------SocketIO-----------------------------------
var socket = io();

socket.on("connect",()=>{
    
    playerName = sessionStorage.getItem("playerName");
    if(playerName){ // nur wenn name angegeben darf man connecten
        // document.getElementById("selfPlayer").innerHTML = "Player name: "+sessionStorage.getItem("playerName")+
        //"  PlayerID: "+ socket.id;                           // get the session storage player Info


        //if no reconnect sessionStorage.setItem("socketID",socket.id);           // set socketID
        var oldSocketID;
        if(sessionStorage.getItem("socketID")){
            oldSocketID= sessionStorage.getItem("socketID");
        }
        var playerInfo=
        {
            playerName:playerName,
            oldSocketID:oldSocketID
        }
        
        sessionStorage.setItem("socketID",socket.id);  // override old socketID

        socket.emit("playerJoinRequest",JSON.stringify(playerInfo));            // emit gameRoom request
    }else{
       // window.location.href= indexLink;
    }
   
})

function setRoomInfo (yourRoom){
    document.getElementById("room").innerHTML=yourRoom.IORoomName;
    if(yourRoom.player1){
        var statusP1;
        if(yourRoom.player1.isReady){
            
            statusP1="Is Ready";
            document.getElementById("p1Ready").style.display="inline-block";   // change visibility of ready and not ready signs
            document.getElementById("p1NotReady").style.display="none";
        }else{
            statusP1="Is Not Ready";
            document.getElementById("p1Ready").style.display="none";   // change visibility of ready and not ready signs
            document.getElementById("p1NotReady").style.display="inline-block";
        }
    }else{
        statusP1="Is Not Ready";
        document.getElementById("p1Ready").style.display="none";   // change visibility of ready and not ready signs
        document.getElementById("p1NotReady").style.display="inline-block";
    }
    
    if(yourRoom.player2){
        var statusP2;
        if(yourRoom.player2.isReady){
            statusP2="Is Ready";
            document.getElementById("p2Ready").style.display="inline-block";   // change visibility of ready and not ready signs
        document.getElementById("p2NotReady").style.display="none";
        }else{
           statusP2="Is Not Ready";
           document.getElementById("p2Ready").style.display="none";   // change visibility of ready and not ready signs
            document.getElementById("p2NotReady").style.display="inline-block";
        }
    }else{
        statusP2="Is Not Ready";
        document.getElementById("p2Ready").style.display="none";   // change visibility of ready and not ready signs
        document.getElementById("p2NotReady").style.display="inline-block";
    }

    if(yourRoom.player1){
        document.getElementById("player1").innerHTML = 
        "Player 1: "+yourRoom.player1.name;/*+
        " Status: "+statusP1+
        " SocketID: "+yourRoom.player1.socketID;*/
        
    }else{
        document.getElementById("player1").innerHTML = "Player 1: ";
        
    }
    if(yourRoom.player2){
        document.getElementById("player2").innerHTML = 
        "Player 2: "+yourRoom.player2.name;/*+
        " Status: "+statusP2+
        " SocketID: "+yourRoom.player2.socketID;*/
        
    }else{
        document.getElementById("player2").innerHTML = "Player 2: ";
        
    }
    lineWidth=yourRoom.lineWidth*canvasSide/1000;
    mainCtx.lineWidth=lineWidth;
    animCtx1.lineWidth=lineWidth;
    animCtx2.lineWidth=lineWidth;
}

function setPlayer(yourRoom){
    if(yourRoom.player1&&socket.id==yourRoom.player1.socketID){  // wenn client socket id == raum socketid von player 1
        playerSelf=yourRoom.player1;
        playerOpponent = yourRoom.player2;
    }else if(yourRoom.player2){
        playerSelf=yourRoom.player2;
        playerOpponent = yourRoom.player1;
    }
    if(yourRoom.player1&&!p1StartDrawn){// draw initial canvas pos
        var p1=yourRoom.player1;
        mainCtx.strokeStyle=p1.color;
        mainCtx.beginPath();
        mainCtx.moveTo(p1.xCurrent*canvasSide/1000,p1.yCurrent*canvasSide/1000);   // scale the points with the respective canvas width
        mainCtx.lineTo(p1.xCurrent*canvasSide/1000,p1.yCurrent*canvasSide/1000);
        mainCtx.stroke(); 
        //console.log("hi vom malen p1");↑
        var fontSize=canvasSide/30;
        mainCtx.font = fontSize+"px Arial";
        mainCtx.fillStyle="grey";
        mainCtx.textAlign = "center";
        mainCtx.fillText("↑", p1.xCurrent*canvasSide/1000, p1.yCurrent*canvasSide/1000-canvasSide/25);
        p1Color=yourRoom.player1.color;
    }
    if(yourRoom.player2&&!p2StartDrawn){// draw initial canvas pos
        var p2=yourRoom.player2;
        mainCtx.strokeStyle=p2.color;
        mainCtx.beginPath();
        mainCtx.moveTo(p2.xCurrent*canvasSide/1000,p2.yCurrent*canvasSide/1000);
        mainCtx.lineTo(p2.xCurrent*canvasSide/1000,p2.yCurrent*canvasSide/1000);
        mainCtx.stroke(); 
        var fontSize=canvasSide/30;
        mainCtx.font = fontSize+"px Arial";
        mainCtx.fillStyle="grey";
        mainCtx.textAlign = "center";
        mainCtx.fillText("↑", p2.xCurrent*canvasSide/1000, p2.yCurrent*canvasSide/1000-canvasSide/25);
        //console.log("hi vom malen p2");
        p2Color=yourRoom.player2.color;
    }
    if(playerSelf.isReady){
        //root.style.setProperty('--button-background', "rgba(255,158,0,1)");
        //document.getElementById("playerReadyButton").style.backgroundColor="var(--grey)";
        //document.getElementById("playerReadyButton").innerHTML="Your Ready!";
        //document.getElementById("playerReadyButton").style.cursor="auto";
        document.getElementById("playerReadyButton").style.display="none";
    
    }else{
        //document.getElementById("playerReadyButton").style.display="block";
        document.getElementById("playerReadyButton").style.backgroundColor="var(--orange)";
        document.getElementById("playerReadyButton").innerHTML="Ready";
        document.getElementById("playerReadyButton").style.cursor="pointer";
    }

}


socket.on("roomJoined",(roomObject)=>{
    yourRoom=JSON.parse(roomObject);                                   // receive roomRequest anserw and set it to client and set roomNumber
    setRoomInfo(yourRoom);
    setPlayer(yourRoom);

});
socket.on("roomReady",(roomObject)=>{
    yourRoom=JSON.parse(roomObject);                                   // receive roomRequest anserw and set it to client and set roomNumber
    setRoomInfo(yourRoom);
    document.getElementById("playerReadyButton").style.display="block";  // show button to click ready
    setPlayer(yourRoom);
});

socket.on("playerDisconnect",(roomObject)=>{
    yourRoom=JSON.parse(roomObject);                                   // receive roomRequest anserw and set it to client and set roomNumber
    setRoomInfo(yourRoom);
    setPlayer(yourRoom);
    document.getElementById("playerReadyButton").style.display="none";  // show button to click ready
    
});

socket.on("aPlayerIsReady",(roomObject)=>{
    yourRoom=JSON.parse(roomObject);                                   // receive roomRequest anserw and set it to client and set roomNumber
    setRoomInfo(yourRoom);
    setPlayer(yourRoom);
    
});
socket.on("bothPlayersReady",(roomObject)=>{
    yourRoom=JSON.parse(roomObject); 
    setPlayer(yourRoom);
    startCountDown();
    document.getElementById("playerReadyButton").style.display="none";
});
socket.on("rejoinUpdate",(roomObject)=>{
    yourRoom=JSON.parse(roomObject); 
    setPlayer(yourRoom);
    setRoomInfo(yourRoom);
    drawPreviousPath(yourRoom,yourRoom.player1); // redraw p1 path
    drawPreviousPath(yourRoom,yourRoom.player2); // redraw p2 path
    document.getElementById("playerReadyButton").style.display="none";
});

function drawPreviousPath(yourRoom,player){
    
   
    var vBase = yourRoom.vBase; // kleinster abstand zwischen zwei punkten
    mainCtx.strokeStyle = player.color;
    for(var i=0;i<=player.x.length-2;i++){
        mainCtx.beginPath();
        
        mainCtx.moveTo(player.x[i]*canvasSide/1000,player.y[i]*canvasSide/1000);
        //distance between next point and x|y
        var distanceSquared=(player.x[i]-player.x[i+1])*(player.x[i]-player.x[i+1])+(player.y[i]-player.y[i+1])*(player.y[i]-player.y[i+1]);
        if( distanceSquared<3*vBase*vBase){// dann war dazwischen kein   unsichtbarer jump
            mainCtx.lineTo(player.x[i+1]*canvasSide/1000,player.y[i+1]*canvasSide/1000);
            mainCtx.stroke();
        }
    }
}
function playerIsReady(){
    
    socket.emit("playerIsReady","");
}
//----ingame sending
function sendInputUpdate(){
    if(yourRoom.gameStarted){// wenn game gestartet ist
        console.log("leftRight");
        if(leftArrowDown&&rightArrowDown){ // both arrow down
            socket.emit("InputUpdate","0"); // winkelgeschwindigkeit 0
        }else if(leftArrowDown){
            socket.emit("InputUpdate","-1"); // winkelgeschwindigkeitsfaktor 1
        }else if(rightArrowDown){
            socket.emit("InputUpdate","1"); // winkelgeschwindigkeitsfaktor 1
        }else{ // no arrow down
            socket.emit("InputUpdate","0"); // winkelgeschwindigkeit 0
        }
    }
        
}
// ingame receiving
socket.on("pleaseDraw",(coordsObjectString)=>{
    console.log("hier wird gemalt");
    var coordsObject=JSON.parse(coordsObjectString);
    // draw the new positions
    var p1 = coordsObject.player1;
    var p2 = coordsObject.player2;
    //console.log(p1);
    //console.log(p2);
    //console.log(coordsObject);
    if(p1.isVisible){
        mainCtx.strokeStyle=yourRoom.player1.color;           //draw new p1 info
        mainCtx.beginPath();
        mainCtx.moveTo(p1.xOld*canvasSide/1000,p1.yOld*canvasSide/1000);
        mainCtx.lineTo(p1.x*canvasSide/1000,p1.y*canvasSide/1000);
        //mainCtx.closePath();
        mainCtx.stroke();
    }else{
        animCtx1.clearRect(0,0,animCanvas1.width,animCanvas1.height);
        animCtx1.fillStyle=yourRoom.player1.color; 
       // animCtx1.fillStyle="green"; 
        animCtx1.beginPath();
        animCtx1.arc(p1.x*canvasSide/1000, p1.y*canvasSide/1000, lineWidth/2, 0, 2 * Math.PI);
        animCtx1.fill();
    }
     
    if(p2.isVisible){
        mainCtx.strokeStyle=yourRoom.player2.color;  // draw new p2 info
        mainCtx.beginPath();
        mainCtx.moveTo(p2.xOld*canvasSide/1000,p2.yOld*canvasSide/1000);
        mainCtx.lineTo(p2.x*canvasSide/1000,p2.y*canvasSide/1000);
        mainCtx.stroke();
    }else{
        console.log("p2Invisible")
        animCtx2.clearRect(0,0,animCanvas2.width,animCanvas2.height);
        animCtx2.fillStyle=yourRoom.player2.color;
        //animCtx1.fillStyle="green";  
        animCtx2.beginPath();
        animCtx2.arc(p2.x*canvasSide/1000, p2.y*canvasSide/1000, lineWidth/2, 0, 2 * Math.PI);
        animCtx2.fill();
    }
     

});

socket.on("winnerIs",(winner)=>{
   // console.log("clientWinner"+winner);
   document.getElementById("reload").style.display="block";
    if(winner=="player1"){
        document.getElementById("winnerName").innerHTML=yourRoom.player1.name;
        document.getElementById("winnerName").style.color=yourRoom.player1.color;
        document.getElementById("winner").style.display="inline-block";
    }else{
        document.getElementById("winnerName").innerHTML=yourRoom.player2.name;
        document.getElementById("winnerName").style.color=yourRoom.player2.color;
        document.getElementById("winner").style.display="inline-block";
    }
});

socket.on("setRejoinCountdown",(gamePausedObjectString)=>{
    
    var gamePausedObject=JSON.parse(gamePausedObjectString);
    var countdown=gamePausedObject.countdownIncrement;
    var playerNameDisconnected = gamePausedObject.player.name;
    //console.log(gamePausedObject);
    if(!(countdown==0||countdown=="0")){
        document.getElementById("reJoinCountDown").style.display="block";
        document.getElementById("reJoinCountDown").innerHTML=countdown;
    }else{
        //console.log("test aus countdown zero");
        document.getElementById("reJoinCountDown").style.display="none";
    }
    
});

socket.on("setResumeCountdown",(countdown)=>{
    if(!(countdown==0||countdown=="0")){
        document.getElementById("resumeCountdown").style.display="block";
        document.getElementById("resumeCountdown").innerHTML=countdown;
    }else{
        //console.log("test aus countdown zero");
        document.getElementById("resumeCountdown").style.display="none";
    }
});





//Client Emit:
//
//  on join mit name und socketID || passt
//  
//  on ready  || gemacht
//  on leave ||gemacht


//  im Game:
//      on richtungsänderung <- ^ ->
//
//Client Receive:

//  on join to gameroom mit room number  player 1 and player 2 || geamcht
//  on join von mitspieler || gemacht
// on ready mitspieler || gemacht

//   on game start
//  
//  on leave vom anderen
//    im Game:
//       on update wahre pos und richtung für prediction alle 100 ms (evtl. richtung  (also client simuliert spiel selbst durch))
//      on crash mit gewinner
//      
