const Joi = require("joi");
const mongoose = require("mongoose");

const MatchesSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  matched_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
});

exports.MatchModel = mongoose.model("usersMatches", MatchesSchema);
exports.ValdiateUnMatch = (requestBody) =>{
  let joiObject = Joi.object({
    _matchId: Joi.string().required().max(300)
  }); 
  return joiObject.validate(requestBody);
}



