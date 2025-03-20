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
    console.log("Client connected");
    
        
    socket.on("data", async(data) => {
        const message = data.toString().trim();
        console.log("Received:", message);
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
                
                if(!clients.has(matchedUserId)){
                    socket.write("Error| user is currently offline \n")
                }
                else {
                    socket.write("online\n");
                    clients.get(matchedUserId).write(UserSender.username + "| "+ content + ":approved|\n");


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
        console.log(`Client ${userId} disconnected`);
        
    
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