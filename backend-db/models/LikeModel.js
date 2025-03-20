const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    liked_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // createdAt: { type: Date, default: Date.now, expires: '7d' } // Expires after 7 days
});

module.exports = mongoose.model('userLikes', LikeSchema);
