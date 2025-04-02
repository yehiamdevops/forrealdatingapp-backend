const Joi = require('joi');
const jwt = require('jsonwebtoken');
require('../secret/secretConf.js');
const mongoose = require('mongoose');
const { TOKEN_STRING } = require('../secret/secretConf.js');

let usersSchema = new mongoose.Schema({
firstName:String , 
lastName:String , 
age:Number ,
minPreferredAge:Number,
maxPreferredAge:Number,
email:String,
username: String,
profilePicture: String,
pictures:[String],
birthDate: Date,
gender: String,
preferredGender:String,
bio: String,
password:String,
token:String
})

// אנחנו צריכים לייצא את המודל שבנוי משם הקולקשן אליו נרצה לשלוח מידע שיעבור בסכמה ומשם הסכמה עצמה
exports.UserModel = mongoose.model("users" , usersSchema)
// שם המודל חייב להתחיל עם אות גדולה + שם הקולקשן חייב להסתיים עם אס 
// TODO:
// Validation

exports.validateSignup = (_reqBody) => {
    let joiSchema = Joi.object({
        firstName: Joi.string().min(2).max(99).required(),
        lastName: Joi.string().min(2).max(99).required(),
        age: Joi.number().min(18).max(99).required(),
        minPreferredAge: Joi.number().min(18).max(99),
        maxPreferredAge: Joi.number().min(18).max(99),
        email: Joi.string().trim().min(3).max(77).required(),
        username: Joi.string().min(6).max(99).required(),
        pictures: Joi.array().items(Joi.string().max(200)).required(),
        birthDate: Joi.date().max('now').iso().required(),
        gender: Joi.string().required().max(15).min(1),
        preferredGender: Joi.string().required().min(4),
        bio: Joi.string().required().max(50),
        password: Joi.string().required().max(200),
        profilePicture: Joi.string().max(200)
    });
    
  // נבדוק את המידע בצד הלקוח על מנת לחסוך קריאה לדאטה בייס ונבדוק שהמידע תקין ובמידה ולא ניתן הודעה מתאימה בצד לקוח 
// שימו לב למיקום הבדיקה בראוט
// לא נוכל לשלוח מאפיין שלא קיים בסכימה ובנוסף נקבל את השגיאה המדויקת בצד לקוח
return joiSchema.validate(_reqBody);
};
exports.validateLogin = (_reqBody) =>{
    let joiSchema = Joi.object({
      username: Joi.string().min(3).max(77).required(),
      password: Joi.string().required().min(6).max(80)
    });
    return joiSchema.validate(_reqBody);
};
exports.validatePicture = (_reqBody) =>{
    let joiSchema = Joi.string().required().max(100);
    return joiSchema.validate(_reqBody);
};
exports.validateProfileUpdate = (_reqBody) =>{
    let joiSchema = Joi.object({
      firstName: Joi.string().min(3).max(77).required(),
      age: Joi.number().required().min(18).max(99),
      bio: Joi.string().required().max(50)
    });
    return joiSchema.validate(_reqBody);
};
exports.createToken = (id) =>{
  let token = jwt.sign( { _id: id }, TOKEN_STRING , {expiresIn: "180mins"});
  return token;

  
};

