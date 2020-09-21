//---------------------------------Event Listener-----------------------------------

document.getElementById("joinGameButton").addEventListener("click",nameCheck);
document.addEventListener("keydown",(e)=>{  // click button on enter
    if(e.keyCode=="13"){
        nameCheck();
    }
});


//__________________________Game Joiner_____________________________________--

function gameJoinProcess(playerName){
    // Store name in session
sessionStorage.setItem("playerName", playerName);
// Retrieve
//document.getElementById("result").innerHTML = sessionStorage.getItem("lastname"); 
window.location.href= "http://localhost:3000/gameRoom.html";
    
}
function nameCheck(){                                               // check if playername is has more than 4 letters
    var playerName = document.getElementById("playerName").value ;
    if(playerName.length>=4){
        gameJoinProcess(playerName);
    }
}