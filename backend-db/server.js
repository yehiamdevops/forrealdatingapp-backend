const net = require("net");
const { MatchModel } = require("./models/MatchModel");
const { UserModel } = require ("./models/usersModel");
const { SOCKET_PORT } = require('./secret/secretConf.js');
const { Message } = require("./models/MessageModel.js");
// Store connected clients with their userIds
const clients = new Map();
const server = net.createServer((socket) => {
    let userId = null;
    let matchedUserId = null;
    let messageObj = {};
    let matchedUserIds = null;
    console.log("Client connected");
    
        
    socket.on("data", async(data) => {
        const message = data.toString().trim();
        console.log("Received:", message);
        if (message.includes("StoppedTyping|")) {
            matchedUserId = message.split("|")[1];
            userId = message.split("|")[2];
            if (clients.has(matchedUserId)) {
                clients.get(matchedUserId).write(`StoppedTyping|no-usage|${userId}\n`)
            }




        }
        if (message.includes("Typing|") && message.startsWith("Typing|")) {
            matchedUserId = message.split("|")[1];
            userId = message.split("|")[2];
            let username = await UserModel.findOne({_id: userId});
            
            if (clients.has(matchedUserId)) {
                clients.get(matchedUserId).write(`Typing|${username.username}|${userId}\n`);
                
            }
            
        }
        if(message.includes("Broadcast|")){
            userId = message.split("|")[1].trim();
            console.log(userId);
            
            const matches = await MatchModel.find({ user_id: userId }, { matched_user_id: 1, _id: 0 });
            

            // Extract only the matched_user_id values
            matchedUserIds = matches.map(match => match.matched_user_id.toString());
            
            
            
            matchedUserIds.forEach(matchid=>{
                console.log(matchid);
                if (clients.has(userId)) {
                    if (clients.has(matchid)) {
                        socket.write(`MatchesPageStatus|${matchid}|online\n`);
                        clients.get(matchid).write(`MatchesPageStatus|${userId}|online\n`);
                    }
                    else{
                        socket.write(`MatchesPageStatus|${matchid}|offline\n`);
                    }
                }
               

            })
            
        }
        if(message.includes("UnmatchSocket|")){
            matchedUserId = message.split("match:")[1].trim();
            // console.log(userId);
            // console.log(matchedUserId);
            
            if (clients.has(matchedUserId)) {
                clients.get(matchedUserId).write(`Unmatched| userid: ${socket.userId}\n`);
                
            }
            
            
            socket.write("\n")
            
        }
        if (message.includes("userInteract|")) {
            userId = message.split("|")[1].trim();
            console.log(clients.has(userId));
        
            if (clients.has(userId)) {
                const oldSocket = clients.get(userId);
                await oldSocket.write("Unallowed\n"); // Notify the old client
                // oldSocket.destroy(); // Force close the old connection
            }
        
            clients.set(userId, socket);
            socket.userId = userId; // Store userId inside the socket
        
            socket.write(`Allowed|Hello ${userId}! You've been registered successfully.\n`);
        }
        
        if (message === "DISCONNECT") {
            if (socket.userId && clients.get(socket.userId) === socket) { 
                // Only remove if this socket is still in the map
                clients.delete(socket.userId);
            }
        }
        if (message.includes("MESSAGE|")) {
            // Extract userId and message content
            const parts = message.split("input:");
            // console.log(parts);
            
            if (parts.length === 2) {
                const content = parts[1].split("|")[0].trim();
                matchedUserId = parts[1].split("|")[1].split("matchid:")[1].trim();
                // console.log(matchedUserId);
                console.log(content);
                
                
                
                const match = await MatchModel.findOne({user_id: socket.userId, matched_user_id: matchedUserId});
                if(!match) return;
                // console.log(user);
                const UserSender = await UserModel.findOne({_id: userId});
                const UserReciver =await UserModel.findOne({_id: matchedUserId});
                // Store client if new
                if(clients.has(matchedUserId)){
                    clients.get(matchedUserId).write("MessageRecieved|" + UserSender.username + "|"+ content +"|" + UserSender._id + "\n");

                }
                messageObj = {
                    senderUsername: UserSender.username,
                    receiverUsername: UserReciver.username, 
                    message: content
                }
                let newMsg = new Message(messageObj);
                await newMsg.save();
                

                    
                    


                }
                // else{
                //     // socket.write(":append\n");
                // }
                

            }
        
    });

    socket.on("end", () => {
        console.log(`Client ${socket.userId} disconnected`);
        socket.destroy();
        if (matchedUserIds) {
            matchedUserIds.forEach(matchid=>{
                if(clients.has(matchid)){
                    console.log("test");
                    
                    clients.get(matchid).write(`MatchesPageStatus|${userId}|offline\n`);
                }
            });
            
        }
    
    });
    
    socket.on("error", (err) => {
        if (err.code === "ECONNRESET") {
            console.log(`Client ${userId} disconnected unexpectedly (ECONNRESET)`);
            if (userId) {
                clients.delete(userId);
            }
        } else {
            console.error("Socket error:", err);
        }
    });
});

server.on("error", (err) => {
    console.error("Server error:", err);
});

server.listen(SOCKET_PORT, () => console.log(`TCP server running on port ${SOCKET_PORT} `));
module.exports = server;