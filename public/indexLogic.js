//---------------------------------Event Listener-----------------------------------

document.getElementById("joinGameButton").addEventListener("click",gameJoinProcess);
document.addEventListener("keydown",(e)=>{  // click button on enter
    
    if(e.keyCode=="13"){
        gameJoinProcess();
    }
});
document.addEventListener("keyup",(e)=>{  // click button on enter
    nameCheck();

});


//__________________________Game Joiner_____________________________________--
var allowedToJoin=false;
var errorIsShown=false;
let root = document.documentElement; // for variable css styles
function gameJoinProcess(){
    // Store name in session
  
    if(allowedToJoin){
        var playerName=document.getElementById("playerName").value;
        sessionStorage.setItem("playerName", playerName);
        // Retrieve
        //document.getElementById("result").innerHTML = sessionStorage.getItem("lastname"); 
        window.location.href= "https://achtung.herokuapp.com/gameRoom.html";
        //window.location.href= "http://localhost:3000/gameRoom.html";
    }else{
        document.getElementById("nameError").style.visibility="visible";
        errorIsShown=true;
       
    }

}
function nameCheck(){                                               // check if playername is has more than 4 letters
    var playerName=document.getElementById("playerName").value;
    console.log("hi");
    if(playerName.length>=3){
        root.style.setProperty('--button-background', "rgba(255,158,0,1)");
        document.getElementById("joinGameButton").style.cursor="pointer";
        allowedToJoin=true;
        if(errorIsShown){
            document.getElementById("nameError").style.visibility="hidden";
            errorIsShown=false;
        }
    }else{
        root.style.setProperty('--button-background', "#221f1f");
        document.getElementById("joinGameButton").style.cursor="auto";
        allowedToJoin=false;
        
    }
}

//------------------------------------------------------------Explanation canvas----------------------------------

const steerCanvas=document.getElementById("steerCanvas");
const steerCtx = steerCanvas.getContext('2d');

const wallCrashCanvas=document.getElementById("wallCrashCanvas");
const wallCrashCtx = wallCrashCanvas.getContext('2d');

const selfCrashCanvas=document.getElementById("selfCrashCanvas");
const selfCrashCtx = selfCrashCanvas.getContext('2d');

const opponentCrashCanvas=document.getElementById("opponentCrashCanvas");
const opponentCrashCtx = opponentCrashCanvas.getContext('2d');

var canvasSide=window.innerHeight/10;
var dt = 30;
var singleAnimationTime=3000;
var vBase=canvasSide/100;
var vPhi=3/360*6;

steerCanvas.width  = canvasSide;
steerCanvas.height = canvasSide;
steerCtx.lineCap="round";
steerCtx.lineWidth=canvasSide/15;
steerCtx.strokeStyle="red";
var steerX=canvasSide/2;
var steerY=canvasSide;
var steerPhi=Math.PI*3/2;

wallCrashCanvas.width  = canvasSide;
wallCrashCanvas.height = canvasSide;
wallCrashCtx.lineCap="round";
wallCrashCtx.lineWidth=canvasSide/15;
wallCrashCtx.strokeStyle="yellow";
var wallX=canvasSide/2;
var wallY=canvasSide;
var wallPhi=Math.PI*3/2;

selfCrashCanvas.width  = canvasSide;
selfCrashCanvas.height = canvasSide;
selfCrashCtx.lineCap="round";
selfCrashCtx.lineWidth=canvasSide/15;
selfCrashCtx.strokeStyle="red";
var selfX=canvasSide/2;
var selfY=canvasSide;
var selfPhi=Math.PI*3/2;

opponentCrashCanvas.width  = canvasSide;
opponentCrashCanvas.height = canvasSide;
opponentCrashCtx.lineWidth=canvasSide/15;
opponentCrashCtx.lineCap="round";
var opponentX=canvasSide/2;
var opponentY=canvasSide;
var p1Phi=Math.PI*3/2;;
var p1X=canvasSide/2;
var p1Y=canvasSide;
var p2X=canvasSide;
var p2Y=canvasSide*0.58;

var cols = document.getElementsByClassName('explCanvas');
  for(i = 0; i < cols.length; i++) {
    cols[i].style.borderColor = 'var(--green)';
  }




function animationManager(){
    root.style.setProperty('--displaySteerDesktop', "flex");
    showSection("--displaySteerMobil");
    updateSteerCanvas(0);
}

function updateSteerCanvas(time){ // each animation is 3 seconds
    steerCtx.beginPath()
    
    if(time<100){
        steerCtx.moveTo(steerX,steerY);
        var newX= steerX;
        var newY=steerY-vBase
        steerCtx.lineTo(newX,newY);
        steerCtx.stroke();
        steerX=newX;
        steerY=newY;
    }else if(time<900){
        document.getElementById("leftArrow").style.color="var(--orange)"
        document.getElementById("leftArrow").style.borderColor="var(--orange)"
        steerCtx.moveTo(steerX,steerY);
        steerPhi=steerPhi-vPhi;
        var newX= steerX +Math.cos(steerPhi)*vBase;
        var newY=steerY+Math.sin(steerPhi)*vBase
        steerCtx.lineTo(newX,newY);
        steerCtx.stroke();
        steerX=newX;
        steerY=newY;

    }else if(time>900&&time<2600){
        document.getElementById("leftArrow").style.color="white"
        document.getElementById("leftArrow").style.borderColor="white"
        document.getElementById("rightArrow").style.color="var(--orange)"
        document.getElementById("rightArrow").style.borderColor="var(--orange)"
        steerCtx.moveTo(steerX,steerY);
        steerPhi=steerPhi+vPhi;
        var newX= steerX +Math.cos(steerPhi)*vBase;
        var newY=steerY+Math.sin(steerPhi)*vBase
        steerCtx.lineTo(newX,newY);
        steerCtx.stroke();
        steerX=newX;
        steerY=newY;

    }else{
        document.getElementById("rightArrow").style.color="white"
        document.getElementById("rightArrow").style.borderColor="white"
        document.getElementById("leftArrow").style.color="var(--orange)"
        document.getElementById("leftArrow").style.borderColor="var(--orange)"
        steerCtx.moveTo(steerX,steerY);
        steerPhi=steerPhi-vPhi;
        var newX= steerX +Math.cos(steerPhi)*vBase;
        var newY=steerY+Math.sin(steerPhi)*vBase
        steerCtx.lineTo(newX,newY);
        steerCtx.stroke();
        steerX=newX;
        steerY=newY;

    }
    if(time<3000){
        setTimeout(()=>{
            updateSteerCanvas(time+dt);
        },dt);
    }else{
        showSection("--displayWallMobil");
        document.getElementById("leftArrow").style.color="white";
        document.getElementById("leftArrow").style.borderColor="white";
        root.style.setProperty('--displayWallDesktop', "flex");
        updateWallCrash(0);
    }
    
}
function updateWallCrash(){
    wallCrashCtx.beginPath();
    if(wallY>0){
        wallCrashCtx.moveTo(wallX,wallY);
        
        var newX= wallX +Math.cos(wallPhi)*vBase;
        var newY=wallY+Math.sin(wallPhi)*vBase
        wallCrashCtx.lineTo(newX,newY);
        wallCrashCtx.stroke();
        wallX=newX;
        wallY=newY;
        setTimeout(()=>{
            updateWallCrash();
        },dt);
    }else{
        showSection("--displaySelfMobil");
        root.style.setProperty('--displaySelfDesktop', "flex");
        updateSelfCrash(0);
    }
}

function updateSelfCrash(time){
    //console.log("test");
    selfCrashCtx.beginPath();
    if(time<1000){
        console.log("test");
        selfCrashCtx.moveTo(selfX,selfY);
        var newX= selfX;
        var newY=selfY-vBase;
        selfCrashCtx.lineTo(newX,newY);
        selfCrashCtx.stroke();
        selfX=newX;
        selfY=newY;
        setTimeout(()=>{
            updateSelfCrash(time+dt);
        },dt);
    }else if(time<4300){
        
        selfCrashCtx.moveTo(selfX,selfY);
        selfPhi=selfPhi-vPhi;
        var newX= selfX +Math.cos(selfPhi)*vBase;
        var newY=selfY+Math.sin(selfPhi)*vBase
        selfCrashCtx.lineTo(newX,newY);
        selfCrashCtx.stroke();
        selfX=newX;
        selfY=newY;
        setTimeout(()=>{
            updateSelfCrash(time+dt);
        },dt);
    }else{
        showSection("--displayOpponentMobil");
        root.style.setProperty('--displayOpponentDesktop', "flex");
        updateOpponentCrash(0);
    }
    

}
function updateOpponentCrash(time){
    
    
    if(time<100){
        //p1-------------------------------
        opponentCrashCtx.beginPath();
        opponentCrashCtx.strokeStyle="red";
        opponentCrashCtx.moveTo(p1X,p1Y);
        var newX1= p1X;
        var newY1=p1Y-vBase
        opponentCrashCtx.lineTo(newX1,newY1);
        opponentCrashCtx.stroke();
        p1X=newX1;
        p1Y=newY1;
        //p2-------------------------------
        opponentCrashCtx.beginPath();
        opponentCrashCtx.strokeStyle="yellow";
        opponentCrashCtx.moveTo(p2X,p2Y);
        var newX2= p2X-vBase;
        var newY2=p2Y;
        opponentCrashCtx.lineTo(newX2,newY2);
        opponentCrashCtx.stroke();
        p2X=newX2;
        p2Y=newY2;
    }else if(time<900){
        //p1-------------------------------
        opponentCrashCtx.beginPath();
        opponentCrashCtx.strokeStyle="red";
        opponentCrashCtx.moveTo(p1X,p1Y);
        p1Phi=p1Phi-vPhi;
        var newX1= p1X +Math.cos(p1Phi)*vBase;
        var newY1=p1Y+Math.sin(p1Phi)*vBase
        opponentCrashCtx.lineTo(newX1,newY1);
        opponentCrashCtx.stroke();
        p1X=newX1;
        p1Y=newY1;
        //p2-------------------------------
        opponentCrashCtx.beginPath();
        opponentCrashCtx.strokeStyle="yellow";
        opponentCrashCtx.moveTo(p2X,p2Y);
        var newX2= p2X-vBase;
        var newY2=p2Y;
        opponentCrashCtx.lineTo(newX2,newY2);
        opponentCrashCtx.stroke();
        p2X=newX2;
        p2Y=newY2;
    }else if(time>900&&time<2600){
        //p1-------------------------------
        opponentCrashCtx.beginPath();
        opponentCrashCtx.strokeStyle="red";
        opponentCrashCtx.moveTo(p1X,p1Y);
        p1Phi=p1Phi+vPhi;
        var newX1= p1X +Math.cos(p1Phi)*vBase;
        var newY1=p1Y+Math.sin(p1Phi)*vBase
        opponentCrashCtx.lineTo(newX1,newY1);
        opponentCrashCtx.stroke();
        p1X=newX1;
        p1Y=newY1;
        //p2-------------------------------
        opponentCrashCtx.beginPath();
        opponentCrashCtx.strokeStyle="yellow";
        opponentCrashCtx.moveTo(p2X,p2Y);
        var newX2= p2X-vBase;
        var newY2=p2Y;
        opponentCrashCtx.lineTo(newX2,newY2);
        opponentCrashCtx.stroke();
        p2X=newX2;
        p2Y=newY2;
    }else{
        //p1-------------------------------
        opponentCrashCtx.beginPath();
        opponentCrashCtx.strokeStyle="red";
        opponentCrashCtx.moveTo(p1X,p1Y);
        p1Phi=p1Phi-vPhi;
        var newX1= p1X +Math.cos(p1Phi)*vBase;
        var newY1=p1Y+Math.sin(p1Phi)*vBase
        opponentCrashCtx.lineTo(newX1,newY1);
        opponentCrashCtx.stroke();
        p1X=newX1;
        p1Y=newY1;
        //p2-------------------------------
        opponentCrashCtx.beginPath();
        opponentCrashCtx.strokeStyle="yellow";
        opponentCrashCtx.moveTo(p2X,p2Y);
        var newX2= p2X-vBase;
        var newY2=p2Y;
        opponentCrashCtx.lineTo(newX2,newY2);
        opponentCrashCtx.stroke();
        p2X=newX2;
        p2Y=newY2;
    }
    if(time<2300){
        setTimeout(()=>{
            updateOpponentCrash(time+dt);
        },dt);
    }else{
        
    }
}

function showSection(variable){

    root.style.setProperty('--displaySteerMobil', "none");
    root.style.setProperty('--displayWallMobil', "none");
    root.style.setProperty('--displaySelfMobil', "none");
    root.style.setProperty('--displayOpponentMobil', "none");

    root.style.setProperty(variable, "flex");

}


animationManager();


