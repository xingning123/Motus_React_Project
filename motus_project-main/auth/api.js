"use strict";

module.exports = function (app, logger, passport) {
    
    app.get("/", function(req, res) {
        return res.render('index');
    });

    const seedrandom = require('seedrandom');

     // Generate the random code
    function get_randomCode() {
        var currentTimeInMs = new Date().getTime();  // UTC time
        const generator = seedrandom(currentTimeInMs);
        const randomNumber = generator();
        const randomCode = Math.floor(randomNumber*10000);
        return randomCode;
    }

    let redirect_uri = "";
    let code_login_db = {}

    var login = function (req, res, next) {
        //以下`passport.authenticate`是一个中间件函数，因此要让他自执行
        passport.authenticate('local', function(err, user, message) {
            if(user) {
                req.login(user, function(err){
                    if (err) {
                        return res.status(500).json(err);
                    }

                    // Get username, generate random code and redirect to motus /callback with the code as parameter 
                    let code = get_randomCode();
                    let client_login = user.username.trim();
                    code_login_db[code] = client_login;
                    return res.redirect(redirect_uri+"?code="+code)
                });
            }else {
                return res.render('error',{message});
            }
        })(req, res, next);
    };

    app.post("/api/user/login", login);
    app.get("/api/user/login", function(req, res) {
        return res.render('login');
    });

    app.get("/api/user/register", function(req, res) {
        return res.render('register');
    });

    let register = function (req, res, next) {
        passport.authenticate('register', function(err, user, message) {
            if(user) {
                return res.render('registerSuccess');
            } else {
                return res.render('error', {message});
            }
        })(req, res, next);
    };
    app.post("/api/user/register", register);
    app.get("/api/user/logout",  function(req, res) {
        req.logout();
        return res.render('index');
    });

    // API for OAUTH2/OPENID

    // Get the client_id, scope and redirect_uri from motus server and launch the login page
    app.get('/authorize', (req, res) => {
        if (req.query.client_id!="motus_app") {
            return res.status(400).send({
                message: "ERROR, you are not motus_app"
            });
        }
        if (req.query.scope!="openid,username") {
            return res.status(400).send({
                message: "ERROR, wrong scope"
            });
        }
        if (req.query.redirect_uri!="http://localhost:3000/callback") {
            return res.status(400).send({
                message: "ERROR, wrong uri"
            });
        }
        redirect_uri = req.query.redirect_uri;
        res.render("login");
    })
    
    // Get the code from motus server, verify if it's correct and create a token to send to motus /get_token
    const jwt = require("jsonwebtoken");
    const SECRET = "aaaaa";
    app.get('/token', (req, res) => {
        let token = "";

        if (req.query.code in code_login_db) {
            token = jwt.sign({ user: code_login_db[req.query.code] }, SECRET);
        }
        else {
            console.log("Wrong code")
        }
        res.redirect("http://localhost:3000/get_token?token="+token);
    })


}