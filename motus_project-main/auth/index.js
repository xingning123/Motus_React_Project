"use strict"

module.exports = createApplication;

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const log4js = require('log4js');
const logger = log4js.getLogger('app');
const http   = require('http');
const path = require('path');

function createApplication(config) {

    require('./lib/connect')(config);   //Connect to the database

    var app = express();
    
    var server = http.createServer(app);

    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'jade');

    app.use(express.static(path.join(__dirname, 'public')));

    app.use(bodyParser.urlencoded({ extended: false})); 
    app.use(bodyParser.json());
 


    app.use(session({
        secret: config.sessionName,
        name: config.sessionName,
        resave: false, 
        saveUninitialized: true,
        cookie: {
            maxAge: 14 * 24 * 60 * 60 * 1000, // in milliseconds
        },
    }));

    var Passport = require('./lib/passport')();
    app.use(Passport.initialize());
    app.use(Passport.session());

    //Rewrite the listen method and add a default route before starting
    app.listen = function () {
        require('./api')(app, logger, Passport);
        return server.listen.apply(server, arguments);
    };
    return app;
}


