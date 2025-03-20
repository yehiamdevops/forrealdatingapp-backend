const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderUsername: { type: mongoose.Schema.Types.String, required: true, ref: "User" },
  receiverUsername: { type: mongoose.Schema.Types.String, required: true, ref: "User" },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

exports.Message = mongoose.model("Message", messageSchema);