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
        //window.location.href= "https://achtung.herokuapp.com/gameRoom.html";
        window.location.href= "http://localhost:3000/gameRoom.html";
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

