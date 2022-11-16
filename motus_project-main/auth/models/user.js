let db = require('../lib/connect')

class User{
    findUser(username){
      return db().table('users').where('username',username).first();
    }

    save(user){
       return  db().table('users').insert(user);
    }

    findById(userId){
        return  db().table('users').where('id',userId).first();
    }

}

module.exports = User;