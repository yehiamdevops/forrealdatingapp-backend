const usersR = require('./users.js');
const otpR = require("./otp.js");

const Routes = (app) => {
    app.use("/users" , usersR);
    app.use("/otp", otpR );
   
};

module.exports = Routes;