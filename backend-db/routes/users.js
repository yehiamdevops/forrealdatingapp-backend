const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { UserModel, validateSignup, validateLogin ,createToken,validateProfileUpdate, validatePicture} = require('../models/usersModel');
const auth = require('../middlewares/auth.js');
const { DislikeModel } = require('../models/DislikeModel.js');
const LikeModel = require('../models/LikeModel.js');
const { MatchModel, ValdiateUnMatch } = require('../models/MatchModel.js');
const { Message } = require('../models/MessageModel.js');
const { LogContextImpl } = require('twilio/lib/rest/serverless/v1/service/environment/log.js');


router.get('/',auth, async (req, res) => {
    let user = await UserModel.findOne({_id: req.tokenData._id});
    try {
        let data = await UserModel.find({_id: { $ne: req.tokenData._id },
        gender: user.preferredGender
        });
        return res.json(data);
    } catch (err) {
        res.status(500).json({ msg: "err", err });
    }
    
});
router.get('/queryget', auth, async (req, res) => {
  try {
      // Fetch source user and validate
      let SourceUser = await UserModel.findById(req.tokenData._id);
      if (!SourceUser) return res.status(404).json({ msg: "User not found" });

      const maxQueries = 10;
      let skips = parseInt(req.query.page);
      skips = isNaN(skips) || skips < 1 ? 1 : skips;

      let prefgender = SourceUser.preferredGender;
      if (!prefgender) return res.status(400).json({ msg: "Preferred gender not set." });

      let minAge = parseInt(req.query.minAge);
      minAge = isNaN(minAge) || minAge < 18 ? 18 : minAge;

      let maxAge = parseInt(req.query.maxAge);
      maxAge = isNaN(maxAge) || maxAge > 99 ? 99 : maxAge;

      console.log(prefgender, minAge, maxAge);

      // Fetch exclusion lists in parallel
      const excludeIds = await Promise.all([
          DislikeModel.find({ user_id: req.tokenData._id }).distinct("disliked_user_id"),
          MatchModel.find({ user_id: req.tokenData._id }).distinct("matched_user_id"),
          LikeModel.find({ user_id: req.tokenData._id }).distinct("liked_user_id")
      ]);

      // Combine and deduplicate
      const excludedArray = Array.from(new Set([...excludeIds[0], ...excludeIds[1], ...excludeIds[2]]));

      // Construct query
      let query = {
          gender: prefgender,
          age: { $gte: minAge, $lte: maxAge },
          ...(excludedArray.length > 0 && { _id: { $nin: excludedArray } })
      };

      // Fetch users
      let data = await UserModel.find(query)
          .limit(maxQueries)
          .skip((skips - 1) * maxQueries);

      res.json(data);

  } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Internal server error", err });
  }
});


router.get('/myProfile', auth ,async (req, res) => {
  try {
    // console.log(req.tokenData);
    let user = await UserModel.findOne({_id: req.tokenData._id});
    if(user){
      return res.status(201).json(user);
    }
    else{
      return res.status(401).json({err: "cannot fetch user"});
    }
  } catch (error) {
    return res.status(500).json({err: error});
    
  }
});

router.post("/", async (req, res) => {
    let validBody = validateUser(req.body);
    
    if (validBody.error) {
      return res.status(400).json(validBody.error.details);
    }
    try {
      let user = new UserModel(req.body);

      user.password = bcrypt.hash(user.password, 12);
  
      await user.save();
      user.password = "******";
      res.status(201).json(user);
    }
    catch (err) {
      if (err.code == 11000) {
        return res.status(500).json({ msg: "Email already in system, try log in", code: 11000 })
  
      }
      console.log(err);
      res.status(500).json({ msg: "err", err })
    }
  });
router.put('updateprofile/:id',auth, async (req, res) => {
  
  
    let idEdit = req.params.id;
    let { error } = validateProfileUpdate(req.body);
    if (error) {
        return res.status(400).json(error.details[0].message);
    }
    try {
        let data = await UserModel.updateOne({ _id: idEdit}, {$set:{
           firstName: req.body.firstName,
           age: req.body.age,
           bio: req.body.bio
          }});
        res.json(data);

    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "err : ", err });

    }
})
router.put('/addpicture/:id',auth, async (req, res) => {
  let idEdit = req.params.id;
  let { error } = validatePicture(req.body);
  if (error) {
      return res.status(400).json(error.details[0].message);
  }
  try {
      let data = await UserModel.updateOne({ _id: idEdit}, {$push:{pictures: req.body.url}});
      res.json(data);

  } catch (err) {
      console.log(err);
      res.status(500).json({ msg: "err : ", err });

  }

  
});
// router.delete('/:idDel', async (req, res) => {
//     try {
//         let idDel = req.params.idDel;
//         let data = await UserModel.deleteOne({ _id: idDel });
//         res.json(data);
//     } catch (err) {
//         console.log(err);
//         res.status(500).json(data)

//     }
// });
router.post('/signup', async (req, res) => {
      let { error } = validateSignup(req.body);
      if (error){
        return res.status(400).json({err: error});
        
      }
      
        let user = req.body;
        user.password = await bcrypt.hash(user.password, 12);
        let db = new UserModel(user);
        await db.save();
        return res.status(201).json({msg: "success"});
        

      
  
      // const { firstName, lastName, age, email, username,pictures, birthDate,gender, password } = req.body;

     


});

router.post("/login" , async (req, res) => {
    // console.log(req.body);
    
    let { error } = validateLogin(req.body);
    if (error) {
      return res.status(400).json({err: error});
      
    }
    try {
      // קודם כל לבדוק אם המייל שנשלח קיים  במסד
      let user = await UserModel.findOne({ username: req.body.username })
      if (!user) {
        return res.status(401).json({ msg: "Password or email is worng ,code:1" ,token:""});
      }
      let Password = await bcrypt.compare(req.body.password, user.password);
      
      if (!Password) {
        return res.status(401).json({ msg: "Password or email is wrong ,code:2",token:"" });
        
      }
      return res.status(200).json({msg: "login succesful!!!",token:createToken(user._id),_id: user._id});
    }
    catch (err) {
      console.log(err)
      return res.status(500).json({ msg: "catch err", token:""})
    }
  });

router.post('/dislike', auth , async (req, res) => {


  let document = {
    user_id: req.tokenData._id,
    disliked_user_id: req.body._id
  };
  try {
    let dislikeCollection = new DislikeModel(document);
    await dislikeCollection.save();
    return res.status(201).send('success');
    
  } catch (error) {
    return res.sendStatus(500);
  }
  
});
// When User A likes User B
router.post('like',auth, async (req, res) => {
  try {
      await LikeModel.create({user_id: req.tokenData._id, liked_user_id: req.body._id});
      res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(500)
    
  }  
})
router.post('/checkmatch',auth,async (req, res) => {
  // Check if User B already liked User A
  const likeSenderID = req.tokenData._id;
  const likeReciverID = req.body._id;
  const mutualLike = await LikeModel.findOne({ user_id: likeReciverID, liked_user_id: likeSenderID});
try {
  

  if (mutualLike) {
      // It's a match!
      await MatchModel.create([
          { user_id: likeSenderID, matched_user_id: likeReciverID },
          { user_id: likeReciverID, matched_user_id: likeSenderID }
      ]);

      // Clean up the like entries
      await LikeModel.deleteOne({ user_id: likeSenderID, liked_user_id: likeReciverID });
      await LikeModel.deleteOne({ user_id: likeReciverID, liked_user_id: likeSenderID });

      console.log("It's a match!");
      return res.status(200).json({match:true});
      
  } else {
      // No mutual like yet, just add the like
      await LikeModel.create({ user_id: likeSenderID, liked_user_id: likeReciverID });
      return res.status(200).json({match: false});
  }
} catch (error) {
  return res.sendStatus(500);
  
}
})
router.get('/getmatches', auth, async (req, res) => {
  const maxQueries = 10;
  let skips = parseInt(req.query.page);
  skips = isNaN(skips) || skips < 1 ? 1 : skips;
  try {
      // Get the IDs of matched users
      const matchedUserIds = await MatchModel.find({ user_id: req.tokenData._id })
          .distinct("matched_user_id");

      if (matchedUserIds.length === 0) {
          return res.status(404).json([]); // No matches, return empty array
      }

      // Fetch full user profiles of matched users
      const matchedUsers = await UserModel.find({ _id: { $in: matchedUserIds } })
      .limit(maxQueries).skip((skips - 1) * 10);

      return res.json(matchedUsers);
  } catch (err) {
      res.status(500).json({ msg: "err", err });
  }
});
router.post('/unmatch', auth, async (req, res) => {
  const userID = req.tokenData._id;
  const matchID = req.body._matchId;
  const userDB = await UserModel.findOne({_id:userID}).select("username");
  const matchDB = await UserModel.findOne({_id:matchID}).select("username");
  const { error } = ValdiateUnMatch(req.body);
  if(error){
    return res.status(400).json({error: error.details[0].message,approved: false});
  }
  try {
    let validReq = await MatchModel.findOne({
      user_id: userID,
      matched_user_id: matchID

    });
    if(validReq){
      await MatchModel.deleteMany({
        $or: [
          { user_id: userID, matched_user_id: matchID },
          { user_id: matchID, matched_user_id: userID }
        ]
      });
      await Message.deleteMany({
        $or: [
            { senderUsername: userDB.username, receiverUsername: matchDB.username },
            { senderUsername: matchDB.username, receiverUsername: userDB.username }
        ]
    });
      return res.status(200).json({approved:true});
    }
    return res.status(404).json({approved: false});
    
   
  } catch (error) {
    return res.sendStatus(500);
  }
  
});
router.put("/changeprofilepic", auth, async (req, res) => {
    console.log(typeof req.body.url); // This should log 'string'

    
    const { error } = validatePicture(req.body.url);
    if (error) {
      console.log(error);
      
      return res.status(403).json({err: error.details[0].message});
      
    }
    try {
      await UserModel.updateOne(
        {_id: req.tokenData._id},
        {$set:{profilePicture: req.body.url}}
      );
      return res.sendStatus(200);
      
      
      
    } catch (error) {
      return res.sendStatus(500);

      
    }

});
router.post('/getMatchedProfile',auth, async (req, res) => {
  try {
    let isValidMatch = await MatchModel.findOne(
      {
        user_id: req.tokenData._id,
        matched_user_id: req.body.matchID
      });
      if(isValidMatch){
        let matched_user_id = await UserModel.findOne({_id: req.body.matchID});
        return res.status(200).json(matched_user_id);

      }
      return res.status(403).send(null);

  } catch (error) {
      return res.status(500).send(null);
  }
  
});
async function getChatHistory(user1, user2) {
  //message model missing
  console.log(`user1:${user1}\nuser2:${user2}`);
  
  return await Message.find({
    $or: [
      { senderUsername: user1, receiverUsername: user2 },
      { senderUsername: user2, receiverUsername: user1 }
    ]
  })
  .sort({ timestamp: 1 }); // 1 for ascending order
}
router.post('/fetchmessages', auth, async (req, res) => {
  try {
    let matchID = req.body.matchID;
    let userID = req.tokenData._id;
    const UserSender = await UserModel.findOne({_id: userID});
    const UserReciver =await UserModel.findOne({_id: matchID});
    let result = await getChatHistory(UserSender.username, UserReciver.username);
    console.log(result);
    
    return res.status(200).json(result);
    
  } catch (error) {
    return res.status(500).send(null);
  }
  
})
router.put('/resetpassword', async(req, res)=>{
  const newPassword = req.body.password;
  const email = req.body.email;
  try {
    const user = await UserModel.findOne({email: email});
    if(user){
      let passwordMatch = await bcrypt.compare(newPassword, user.password);
      if(passwordMatch) return res.sendStatus(403);

      const hashedPass = await bcrypt.hash(newPassword, 12);
      user.password = hashedPass; 
      await user.save();
    }
    else{
      return res.sendStatus(404);
    }
    return res.sendStatus(201);

    
  } catch (error) {
    console.log(error);
    
    return res.sendStatus(500);
    
  }
});

// אני רוצה לייצא את הראטור לקונפיג ראוט
module.exports = router;