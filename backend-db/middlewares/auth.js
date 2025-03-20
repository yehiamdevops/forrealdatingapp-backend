const jwt = require('jsonwebtoken');
const { TOKEN_STRING } = require('../secret/secretConf');

const auth = async(req, res, next) =>{
    let token = req.header("x-api-key");
    if(!token)
        return res.status(401).json({msg:"send a token to the header to continue",token:""});
    try{
        let tokenData = jwt.verify(token, TOKEN_STRING);//returns payload
        req.tokenData = tokenData;//very efficent for individual front get request
      
        
        next();
        }
        catch(err){
           
        console.log(err);
            
        return res.status(401).json({msg: "token dropped or expired",token:""});
        }
    };
module.exports = auth;