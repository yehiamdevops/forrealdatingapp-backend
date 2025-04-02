const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderID: { type: mongoose.Schema.Types.String, required: true},
  senderUsername: { type: mongoose.Schema.Types.String, required: true},
  recieverID: { type: mongoose.Schema.Types.String, required: true},
  receiverUsername: { type: mongoose.Schema.Types.String, required: true},
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

exports.Message = mongoose.model("messages", messageSchema);