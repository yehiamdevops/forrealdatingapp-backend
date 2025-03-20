const Joi = require('joi');
const mongoose = require('mongoose');
let otpModel = new mongoose.Schema({
    email:String,
    otp:Number,
    createdAt: { type: Date, default: Date.now, expires: '1d' }
});
exports.OtpModel = mongoose.model("otps", otpModel);
exports.OtpValidation = (requestBody) =>{
    let joiSchema = Joi.object({
        email: Joi.string().required().max(100),
        otp: Joi.string().required().max(10)
    });
    return joiSchema.validate(requestBody);
};
