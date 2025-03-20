const { OtpModel, OtpValidation } = require('../models/OtpModel');
const { UserModel } = require('../models/usersModel');
const sendOtp = require('./sendotp');
const router = require('express').Router();

// Route to send OTP
router.post('/send-otp', async (req, res) => {
    const { email, type } = req.body;
  
    if (!email) {
      return res.status(400).send('Email is required');
    }
    try {
      let otpObj;
      let otpStorage = {
        email: email
      }; 
      let otp;
      let db = await UserModel.findOne({email: email});
      if(type == "reset-otp"){
        if(!db) return res.status(404).send('account is not exist');
        otp = await sendOtp(email); 
        otpStorage.otp = otp;
        otpObj = new OtpModel(otpStorage);
        await otpObj.save();
     
      }
      else if(type == "signup-otp"){
  
        if(db) return res.status(403).send('email exist');
        
        otpStorage.otp = otp; // Save OTP for verification
        otpObj = new OtpModel(otpStorage);
        await otpObj.save();
      }
      return res.status(200).send('valid');
    } catch (error) {
      return res.status(500).send('Failed to send OTP');
    }
  });
  
  // Route to verify OTP
  router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;
    const { error } = OtpValidation(req.body);
    if(error){
      return res.status(401).send(error.details[0].message);
    }
    let isOtp = await OtpModel.find({
      email: email, 
      otp: otp
    });
    if (isOtp) {
      await OtpModel.deleteOne({email: email}); // Clear OTP after verification
      res.status(200).send('OTP verified successfully');
    } else {
      res.status(400).send('Invalid OTP');
    }
  });
  module.exports = router;