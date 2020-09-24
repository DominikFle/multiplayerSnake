//const http = require("http");
const fs = require("fs");
const express = require("express");

//const url=require("url");


const app = express();
const hostname = '0.0.0.0'; 
//const hostname = "127.0.0.1";//https://achtung.herokuapp.com/          127.0.0.1
const port = process.env.PORT || 3000;   //3000


app.use(express.static(__dirname + '/public'));  //öffentlichen Zugang zu Ordner erlauben






app.get('/',(req,res)=>{

    res.sendFile(__dirname+"public/index.html")

});




var server = app.listen(port,hostname);  // call back und hostname optional und port
var io = require('socket.io').listen(server);   // socket io mit express app verbinden

var gameRooms={};   // objekt mit alle gamerooms drinne
var openGameRooms=[];
var players=[];
var ingameGameRooms=[];
var lastRoomIndex=0;
var recentlyDisconnectedPlayers={};

const reJoinDelay =4000;
const w = 1000;
const h = 1000;
const lineWidth=30;
const dt=30;
const vBase=5;
const phiBase=1/360*6*5;   // base velocity of phi
//----------Player Creator------------------
function Player(name,socketID){
    this.name = name;
    this.socketID=socketID;
    this.gameRoomID;
    this.playersIndex;
    this.isReady=false;
    this.setGameValues = function(){
        if(gameRooms[this.gameRoomID]){  // wenn der player nen gameRoom hat dann frag welcher player er dort ist
            if(gameRooms[this.gameRoomID].player1==this){ // this is player 1
                this.color = "red";
                this.xCurrent= w/3;
                this.yCurrent = h/2;
            }else{
                this.color = "yellow";
                this.xCurrent= w*2/3;
                this.yCurrent = h/2; 
            }
        }
        
    }
    // game properties
    this.isVisible=true;
    this.color;
    this.xOld;
    this.yOld;
    this.xCurrent;
    this.yCurrent;
    this.x=[];
    this.y=[];
    this.vx;
    this.vy;
    this.phi=Math.PI*3/2; // Initial direction up  ( 2/3 PI)
    this.vPhi=0;
    // game mechanics
    this.selfCollisionCheck=function(gameRoom){// check if player collided with itself
        var x=this.x[this.x.length-1];
        var y=this.y[this.y.length-1];
        var crashed=false;
        for(var i=0;(i<this.x.length-10)&&!crashed;i++){ // solange nicht in letzten 10 updates oder gecrasht wird geloopt

            var distance= Math.sqrt((this.x[i]-x)*(this.x[i]-x)+(this.y[i]-y)*(this.y[i]-y)) // Abstand berechnen
            if(distance<lineWidth){  // crash test
                crashed = true;
            }/*else{ // genau um den abstand die punkte vorspulen ---------DIESE VEREINFACHUNG FUNKTIONIERT NICHT WEGEN LÜCKEN
                    // pro punkt wird gerade vBase zurückgelegt
                var incrementsWithoutPossibleCrash=Math.floor(distance/vBase-5);  // 5 increments abziehn für sicherheit
                if(incrementsWithoutPossibleCrash>0){
                    i=i+incrementsWithoutPossibleCrash;
                }
            }*/
        }
        if(crashed){
            gameRoom.gameIsOver=true;
            if(gameRoom.player1){
                gameRoom.player1.isReady=false;  // wenn gecrasht nichtmehr ready
            }
            
            if(gameRoom.player2){
                gameRoom.player2.isReady=false;  // wenn gecrasht nichtmehr ready
            }
            if(gameRoom.player1==this){  // wenn crashtest von player 1 gemacht wurde dann hat player 2 gewonnen
                io.to(gameRoom.IORoomName).emit("winnerIs","player2");
                
            }else{
                io.to(gameRoom.IORoomName).emit("winnerIs","player1");
                
            }
            
        }
    }
    this.opponentCollisionCheck=function(gameRoom){
        var x=this.x[this.x.length-1];
        var y=this.y[this.y.length-1];
        var crashed=false;
        var opponent;
        if(gameRoom.player1==this){
            opponent=gameRoom.player2;
        }else{
            opponent=gameRoom.player1;
        }
        for(var i=0;(i<opponent.x.length)&&!crashed;i++){ // hier werden alle positionen abgefragt ( inkl. letzten 10)

            var distance= Math.sqrt((opponent.x[i]-x)*(opponent.x[i]-x)+(opponent.y[i]-y)*(opponent.y[i]-y)) // Abstand berechnen
            if(distance<lineWidth){  // crash test
                crashed = true;
            }/*else{ // genau um den abstand die punkte vorspulen ---------DIESE VEREINFACHUNG FUNKTIONIERT NICHT WEGEN LÜCKEN
                    // pro punkt wird gerade vBase zurückgelegt
                var incrementsWithoutPossibleCrash=Math.floor(distance/vBase-5);  // 5 increments abziehn für sicherheit
                if(incrementsWithoutPossibleCrash>0){
                    i=i+incrementsWithoutPossibleCrash;
                }
            }*/
        }
        if(crashed){
            gameRoom.gameIsOver=true;
            if(gameRoom.player1){
                gameRoom.player1.isReady=false;  // wenn gecrasht nichtmehr ready
            }
            
            if(gameRoom.player2){
                gameRoom.player2.isReady=false;  // wenn gecrasht nichtmehr ready
            }
            if(gameRoom.player1==this){  // wenn crashtest von player 1 gemacht wurde dann hat player 2 gewonnen
                io.to(gameRoom.IORoomName).emit("winnerIs","player2");
                
            }else{
                io.to(gameRoom.IORoomName).emit("winnerIs","player1");
                
            }
            
        }
    }


}
//-----------GameRoom creator--------------

function GameRoom(player1,socketRoomIndex){
    this.vBase = vBase;
    this.player1=player1;
    this.player2;
    this.playerList=[];
    this.IORoomIndex=socketRoomIndex;
    this.IORoomName="Room"+socketRoomIndex;
    this.status;  // status : ingame, openForPlayer,
    this.openGameRoomsIndex;
    this.ingameGameRoomsIndex;
    this.isWaitingForRejoin = false;
    this.gameStarted=false;
    this.gameIsOver=false;
    this.gameIsPaused=false;
    this.getNumberOfPlayers = function(){
        if(this.player1&&this.player2){
            return 2;
        }else{
            return 1;
        }
    }
    this.bothPlayersReady = function(){
        if(this.player1&&this.player2){
            if(this.player1.isReady&&this.player2.isReady){
                return true;
            }else{
                return false;
            }
        }else{
            return false;
        } 
    }
    //------ingame properties gameroom
    
    this.lineWidth=lineWidth; //gameRoom receive global lineWidth
    this.update = function(_this){
        //console.log(this);
        if(!_this.gameIsOver&&!_this.gameIsPaused){
           
            var p1=_this.player1;
            var p2=_this.player2;
            // p1
            p1.phi=p1.phi+p1.vPhi;// set new view direction

            p1.vx=Math.cos(p1.phi)*vBase;
            p1.vy=Math.sin(p1.phi)*vBase;
           
            p1.xOld=p1.xCurrent;
            p1.yOld=p1.yCurrent;
            p1.xCurrent=p1.xCurrent+p1.vx
            p1.yCurrent=p1.yCurrent+p1.vy

            if(p1.isVisible){
                
                p1.x.push(p1.xCurrent); // push the x and y vals into the coordinate array
                p1.y.push(p1.yCurrent);
            }
            //p1.x.push(p1.x[p1.x.length-1]+p1.vx); // push the x and y vals into the coordinate array
            //p1.y.push(p1.y[p1.y.length-1]+p1.vy);


            //p2.---------------------------------------------------------------------------------------
            p2.phi=p2.phi+p2.vPhi;// set new view direction

            p2.vx=Math.cos(p2.phi)*vBase;
            p2.vy=Math.sin(p2.phi)*vBase;

            p2.xOld=p2.xCurrent;
            p2.yOld=p2.yCurrent;
            p2.xCurrent=p2.xCurrent+p2.vx
            p2.yCurrent=p2.yCurrent+p2.vy
            
            if(p2.isVisible){
                p2.x.push(p2.xCurrent); // push the x and y vals into the coordinate array
                p2.y.push(p2.yCurrent);
            }

            //p2.x.push(p2.x[p2.x.length-1]+p2.vx); // push the x and y vals into the coordinate array
            //p2.y.push(p2.y[p2.y.length-1]+p2.vy);

                
            
            //collisionChecks
            //this.collisionCheckWall();  // gameroom checkt collision von p1 und p2

            this.player1.selfCollisionCheck(this); // player slebst checken collsion mit sich und anderen
            this.player2.selfCollisionCheck(this);

            var rnd=Math.random();
            if(rnd>0.5){                                       // random reihenfolge bei collisiondetection
                this.player1.opponentCollisionCheck(this);
                if(!this.gameIsOver){                                // wenn schon gecrasht nicht noch zweites mal testen
                    this.player2.opponentCollisionCheck(this);
                }
                
            }else{
                this.player2.opponentCollisionCheck(this);
                if(!this.gameIsOver){
                    this.player1.opponentCollisionCheck(this);
                }
            }
            
            

            var clientInfo={    // info to send to client
                player1:{
                    isVisible:p1.isVisible,
                    xOld:p1.xOld,
                    yOld:p1.yOld,
                    x:p1.xCurrent,
                    y:p1.yCurrent
                },
                player2:{
                    isVisible:p2.isVisible,
                    xOld:p2.xOld,
                    yOld:p2.yOld,
                    x:p2.xCurrent,
                    y:p2.yCurrent
                }
            }
            /*setTimeout(()=>{    // helper for testing delays
                io.to(_this.IORoomName).emit("pleaseDraw",JSON.stringify(clientInfo)); // event to client
            },150);*/
            io.to(_this.IORoomName).emit("pleaseDraw",JSON.stringify(clientInfo)); // event to client
            
           
            setTimeout(()=>{
                _this.update(_this);
            },dt);
        }
    }
    this.collisionCheckWall=function(){
        
        if(this.player1.x[this.player1.x.length-1]+lineWidth/2>w||this.player1.x[this.player1.x.length-1]-lineWidth/2<0||
            this.player1.y[this.player1.y.length-1]+lineWidth/2>h||this.player1.y[this.player1.y.length-1]-lineWidth/2<0){  // if x or y is out of canvas
                this.gameIsOver=true;
                if(this.player1){
                    this.player1.isReady=false;  // wenn gecrasht nichtmehr ready
                }
                
                if(this.player2){
                    this.player2.isReady=false;  // wenn gecrasht nichtmehr ready
                }
                io.to(this.IORoomName).emit("winnerIs","player2");
                this.gameIsOver=true;
        }
        if(this.player2.x[this.player2.x.length-1]+lineWidth/2>w||this.player2.x[this.player2.x.length-1]-lineWidth/2<0||
            this.player2.y[this.player2.y.length-1]+lineWidth/2>h||this.player2.y[this.player2.y.length-1]-lineWidth/2<0){  // if x or y is out of canvas
                this.gameIsOver=true;
                if(this.player1){
                    this.player1.isReady=false;  // wenn gecrasht nichtmehr ready
                }
                
                if(this.player2){
                    this.player2.isReady=false;  // wenn gecrasht nichtmehr ready
                }
                io.to(this.IORoomName).emit("winnerIs","player1"); // if player 1 crahses player 2 is the winner
                this.gameIsOver=true;
        }
    }

    this.visibilityManager=function(gameRoom){
        if(!gameRoom.gameIsOver){    // visibility update nur bis gameEnde
            setTimeout(()=>{
                //console.log("isInvisible");
                if(!gameRoom.gameIsOver){
                    gameRoom.player1.isVisible=false;
                    gameRoom.player2.isVisible=false;
                    setTimeout(()=>{
                        //console.log("sichtbar");
                        if(!gameRoom.gameIsOver){
                            gameRoom.player1.isVisible=true;
                            gameRoom.player2.isVisible=true;
                        }
                        
                    },700);
                    gameRoom.visibilityManager(gameRoom);
                }
                
            },3200);
        }
        
    }
    this.waitingForRejoin=function(player,gameRoom,countdownIncrement){
        
        if(gameRoom.gameIsPaused&&gameRoom.isWaitingForRejoin&&countdownIncrement>0){

            var gamePausedObject=
            {
                player:player,
                countdownIncrement:countdownIncrement
            };

            io.to(gameRoom.IORoomName).emit("setRejoinCountdown",JSON.stringify(gamePausedObject));  // send oBject with player and increment
            if(this.isWaitingForRejoin){
                setTimeout(()=>{
                    gameRoom.waitingForRejoin(player,gameRoom,countdownIncrement-1);
                },1000);
            }
            

        }else{
            var gamePausedObject=
            {
                player:player,
                countdownIncrement:0
            };
            this.isWaitingForRejoin=false;
           io.to(gameRoom.IORoomName).emit("setRejoinCountdown",JSON.stringify(gamePausedObject)); // setze timer zu 0 ... dann wird er gelöscht im front end
            if(countdownIncrement<=0){ // timer abgelaufen
                if(player==gameRoom.player1){
                    
                    io.to(gameRoom.IORoomName).emit("winnerIs","player2");
                }else{
                    io.to(gameRoom.IORoomName).emit("winnerIs","player1");
                }
                this.gameIsOver=true;
                if(gameRoom.player1){
                    gameRoom.player1.isReady=false;  // wenn gecrasht nichtmehr ready
                }
                
                if(gameRoom.player2){
                    gameRoom.player2.isReady=false;  // wenn gecrasht nichtmehr ready
                }
                
            }
        }
    }
    this.resumeTimer=function(countIncrement){
        if(this.isWaitingForRejoin){ // first time in countdown
            this.isWaitingForRejoin=false; // es wird nichtmehr auf weiteren spieler gewartet
            var gamePausedObject=
            {
                player:this.player1, // dummy player nur da um element zu füllen
                countdownIncrement:"0"
            };
            io.to(this.IORoomName).emit("setRejoinCountdown",JSON.stringify(gamePausedObject)); // rejoin timer abbrechen frontend
        }
        

        io.to(this.IORoomName).emit("setResumeCountdown",countIncrement); // send resumecountdown to frontend
        if(this.gameIsPaused&&countIncrement>0){
            var gameRoom = this;
            setTimeout(()=>{
                gameRoom.resumeTimer(countIncrement-1);
            },1000)
        }else if(this.gameIsPaused){   // wenn countdown abgelaufen dann gehts wieder los
            this.gameIsPaused=false;
            this.update(this);
        }
    }
}
//-----------------------------------------------
//-------------------Room Logic---------------------





//----------socket events--------------------------
io.sockets.on('connection', function (socket) {
    //-------------------------------Room Logic--------------------
    function createGameRoom(player){
        lastRoomIndex++;
        var newRoom = new GameRoom(player,lastRoomIndex);
        newRoom.openGameRoomsIndex=openGameRooms.push(newRoom)-1;
        console.log("openGameRooms after Creation");
        console.log(openGameRooms);
        IORoomName="Room"+lastRoomIndex;

        gameRooms[IORoomName]=newRoom;  // add object key to var in square brackets
    
        //console.log(player.socketID);
        
        player.gameRoomID=newRoom.IORoomName;      //create object links
        socket.gameRoom= newRoom;
        player.setGameValues();  // sets gameValues for player like color and position

        socket.join(IORoomName);   // join the socketio room
        io.to(player.socketID).emit("roomJoined",JSON.stringify(newRoom));   // send the response back to the joined socket
        console.log(gameRooms)
    }

    //------
    function joinOpenRoom(player){
        var openRoom =openGameRooms.pop();  // delete openRoom Status and extract room
        if(openRoom.player1){   // abfrage welcher player slot belegt ist und dann den neuen player in anderen slot
            openRoom.player2=player;                       // create gameRoom Player links
        }else{

            openRoom.player1=player;
        }
        
        player.gameRoomID=openRoom.IORoomName;      //create object links   to avoid circular reference save the gameroom id 
        socket.gameRoom= openRoom;
        player.setGameValues();  // sets gameValues for player like color and position

        socket.join(openRoom.IORoomName);
        io.to(openRoom.IORoomName).emit("roomReady",JSON.stringify(openRoom)); // send roomReady event

        console.log("OpenRooms:")
        console.log(openGameRooms);

        console.log("GameRooms");
        console.log(gameRooms);
        console.log("palyers");
        console.log(players);
        console.log("this gameRoom");
        console.log(socket.gameRoom);
    }





    //---------------------------events-----------------------------------------------

    socket.on("playerJoinRequest",(playerInfoString)=>{
        // create new player
        playerInfo=JSON.parse(playerInfoString);
        if(playerInfo.oldSocketID&&   //-------------------------wir waren davor schon gejoined
            recentlyDisconnectedPlayers[playerInfo.oldSocketID]&&       // wir sind innerhalb der letzten 10s rejoined
            recentlyDisconnectedPlayers[playerInfo.oldSocketID].gameIsPaused){  // game ist noch paused

            var gameRoom=recentlyDisconnectedPlayers[playerInfo.oldSocketID];
            delete recentlyDisconnectedPlayers[playerInfo.oldSocketID];
            if(gameRoom.player1.socketID==playerInfo.oldSocketID){ // Spieler war Player 1

                gameRoom.player1.socketID=socket.id;
                socket.player=gameRoom.player1;
                socket.gameRoom=gameRoom;
            }else{  // ansonsten war er player 2
                gameRoom.player2.socketID=socket.id;   // player jeweils  aktualisieren
                socket.player=gameRoom.player2;
                socket.gameRoom=gameRoom; 
            }
            //gameRoom.gameIsPaused=false;
            socket.join(gameRoom.IORoomName); // dem socketIO gameRoom betreten
            io.to(socket.id).emit("rejoinUpdate",JSON.stringify(socket.gameRoom)); // für den rejoiner alle infos setten
            
            gameRoom.resumeTimer(3);

        }else if(playerInfo.playerName){ // Neu gejoint---------------------------------------------------- 
            playerObject=new Player(playerInfo.playerName,socket.id)
            playerObject.playersIndex=players.push(playerObject)-1;   // get Index of player in players array
    
            socket.player=playerObject;   // link from socket to playerobject
    
    
            //if open Rooms available take open rooms
            console.log(openGameRooms.length);
            console.log("can decide rooms when open game rooms is:");
            console.log(openGameRooms)
            if(openGameRooms.length>0){
                console.log("will join OpenGame");
                console.log(openGameRooms)
                joinOpenRoom(playerObject);
                console.log("joinedOpenGame");
            }else{
                createGameRoom(playerObject);
                console.log("gameWasCreated");
            }
        }
        
        
    });
    //-------------delete player-----------------
    function deletePlayer(playerObject){
        players[socket.player.playersIndex]=undefined;
        if(recentlyDisconnectedPlayers[socket.id]){   // auch in recent files delten
            delete recentlyDisconnectedPlayers[socket.id];
        }
        if(socket.gameRoom.player1&&socket.gameRoom.player1==socket.player){ // wenn player 1 leaved
            socket.gameRoom.player1 = undefined;
            socket.gameRoom.playerList[0]=undefined; // delete first entry in playerList array
            socket.gameRoom=undefined;
        }else{  // player 2 left
            socket.gameRoom.player2 = undefined;
            socket.gameRoom.playerList[1]=undefined; // delete first entry in playerList array
            socket.gameRoom=undefined;
        }
    }

    //--------------delete Game
    function deleteGameRoom(gameRoom){
        delete gameRooms[gameRoom.IORoomName];
        if(gameRoom.openGameRoomsIndex==0||gameRoom.openGameRoomsIndex){
            if(openGameRooms[gameRoom.openGameRoomsIndex]==gameRoom){ // double check ob das noch der gameroom ist 
                openGameRooms.splice(gameRoom.openGameRoomsIndex,1); // delete element from open rooms if open
            }
            
        }
       
        if(gameRoom.gameStarted){
            ingameGameRooms.splice(gameRoom.ingameGameRoomsIndex,1); // delete element from open rooms
        }
        socket.gameRoom=undefined;    // delete socket pointer to gameroom
    }





    //----disconnect handler----------
    socket.on("disconnect",(reason)=>{

            console.log("Disconnetct: "+socket.id +reason);
        if(socket.gameRoom){ // das ganze nur machen wenn der überhaupt nen gameRoom hat
            if((!socket.gameRoom.gameStarted&&!socket.gameRoom.gameIsOver&&!socket.gameRoom.gameIsPaused)){ // wenn game noch nicht gestarted .. einfach leaven
                if(socket.gameRoom.getNumberOfPlayers()==2){ // es waren zwei spieler im raum
                    var gameRoom= socket.gameRoom;
                    if(socket.gameRoom.player1){
                        socket.gameRoom.player1.isReady=false;  // wenn gecrasht nichtmehr ready
                    }
                    
                    if(socket.gameRoom.player2){
                        socket.gameRoom.player2.isReady=false;  // wenn gecrasht nichtmehr ready
                    }
                    deletePlayer(socket.player);
                    gameRoom.openGameRoomsIndex=openGameRooms.push(gameRoom)-1; // push room to open rooms and list its index there
                    
                    
                    // send event--------------------
                    io.to(gameRoom.IORoomName).emit("playerDisconnect",JSON.stringify(gameRoom));
        
                    gameRoom=undefined; // delete helper var
                }else{
                    var player = socket.player;             // letzter spieler verlässt den raum
                    var gameRoom = socket.gameRoom;
                    deletePlayer(socket.player);
                    deleteGameRoom(gameRoom);
        
                    player=undefined;   // delete helper vars
                    gameRoom=undefined;
                    // send event aber das kommt nirgendwo an also ok ohne event
                }
            }else if(socket.gameRoom.gameIsOver||socket.gameRoom.getNumberOfPlayers()==1){
                var gameRoom=socket.gameRoom;
                deletePlayer(gameRoom.player);
               
                deleteGameRoom(gameRoom);
                gameRoom=undefined;
    
            }else{
                socket.gameRoom.gameIsPaused=true;
                socket.gameRoom.isWaitingForRejoin=true;
                recentlyDisconnectedPlayers[socket.id]=socket.gameRoom;
                socket.gameRoom.waitingForRejoin(socket.player,socket.gameRoom,Math.floor(reJoinDelay/1000));
                setTimeout(()=>{
                    if(recentlyDisconnectedPlayers[socket.id]){  // erst suchen eventuell schon gelöscht wegen reconnect
                        delete recentlyDisconnectedPlayers[socket.id];
                        deletePlayer(socket.player);
                    }
                   
                },reJoinDelay)                                           // nach reJoinDelay den eintrag wieder entfernen
    
            }
        }
        
        
        
    });

//---------------------------------------------TODO-------------------------------
                            //disconnect handler in game-->ok
                            //reconnecting with set username and socketID in session
                            // update gameRoom and player with new socketID
                            // count down to rejoin
                            // countDown for game resume

    socket.on("playerIsReady",()=>{
        socket.player.isReady=true;
        io.emit(socket.gameRoom.IORoomName).emit("aPlayerIsReady",JSON.stringify(socket.gameRoom));
        if(socket.gameRoom.bothPlayersReady()){
            socket.gameRoom.ingameGameRoomsIndex=ingameGameRooms.push(socket.gameRoom)-1;  // push gameroom to ingame and save index in array
            socket.gameRoom.gameStarted=true;  // game starts
            socket.gameRoom.playerList.push(socket.gameRoom.player1); // fill player list
            socket.gameRoom.playerList.push(socket.gameRoom.player2);
            startGame();
            io.emit(socket.gameRoom.IORoomName).emit("bothPlayersReady",JSON.stringify(socket.gameRoom));
        }
    });
    function startGame(){
        setTimeout(()=>{
            var p1=socket.gameRoom.player1;
            var p2=socket.gameRoom.player2;
            p1.x.push(p1.xCurrent);  // push die starter values in die arrays
            p1.y.push(p1.yCurrent);
            p2.x.push(p2.xCurrent);
            p2.y.push(p2.yCurrent);
            socket.gameRoom.visibilityManager(socket.gameRoom);
            socket.gameRoom.update(socket.gameRoom); // start the game updates
        },3000);
    }
    //---------------------------------sockets INGAME----------------------------
    socket.on("InputUpdate",(vPhiFactorString)=>{     // update lenkungs winkel phi
        if(socket.gameRoom.gameStarted){
            var vPhiFactor=parseInt(vPhiFactorString);
            socket.player.vPhi= vPhiFactor*phiBase;
            
            console.log(socket.player.vPhi);
        }
        
    });


  

});