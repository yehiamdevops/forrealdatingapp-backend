const mongoose = require("mongoose");

const DislikedUserSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  disliked_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  disliked_at: { type: Date, default: Date.now, index: { expires: "30d" } } // Auto-delete after 5 days
});

exports.DislikeModel = mongoose.model("usersDislikes", DislikedUserSchema);


