"use strict";

const passport = require('passport');
const localStrategy = require('passport-local').Strategy;

let User = require('../models/user')

module.exports = function () {
    //Define local strategy
    passport.use('local', new localStrategy(
        {
            usernameField: 'username',
            passwordField: 'password',
        }, function (username, password, done) {
            let user =new User;
            user.findUser(username)
            .then((user) => {
                if (!user) {
                    return done(null, false, 'Invalid user');
                }

                if (user.password.trim() !== password) {
                    return done(null, false, 'Invalid password');
                }
                done(null, user);
            })
            .catch(err => {
                done(null, false, {message: err.message,error:err});
            })
        }
    ));

    passport.use('register', new localStrategy({
                usernameField: 'username',
                passwordField: 'password',
            },
            function(username, password, done) {
                let userModel = new User;
                userModel.findUser(username).then((user) => {
                    // already exists
                    if (user) {
                        let error = 'User already exists with username: ' + username;
                        console.log(error);
                        return done(null, false, error);
                    } else {
                        // if there is no user with that email
                        // create the use

                        // save the user
                        userModel.save({username, password}, ).then( user=> {
                            return done(null, 'user');

                        }).catch(err=>{

                            return done(null,false,err.message)

                        });
                    }
                });
            }
        )
    );


    passport.serializeUser(function (user, done) { //save the user object
        done(null, user['id']); //Can operate through database
    });

    passport.deserializeUser(function (userId, done) {
        let user = new User;
        user.findById(userId).then(user => done(null, user))
    });
    return passport;
}