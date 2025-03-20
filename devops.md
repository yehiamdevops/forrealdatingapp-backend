docker exec -it mongo bash
mongosh -u root -p
// pass: example


use yehiamDB
db.createUser(
   {
     user: "admin",
     pwd: "admin",  // Or  "<cleartext password>"
     roles: [ "readWrite", "dbAdmin" ]
   }
)
add to route users two end points(routs)
1.sign-up
  contain user details, name, age, email, password, image
  validate as i wish  
2.log in 
  require email and pass
  explore bcrypt(hash and compare)
  hash = hide pass
  compare = compare a pass to existing pass in db
  