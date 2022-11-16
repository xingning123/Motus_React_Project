const express = require('express')
const seedrandom = require('seedrandom');
const axios = require('axios');
const app = express()
var session = require('express-session')
const port =  process.env.PORT || 3000

// express-session 
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))


// Get the file containing words
const fs = require('fs');
var words = fs.readFileSync('data/liste_francais_utf8.txt').toString().split("\n");

// FUNCTIONS
function get_todaySeed() {
  var oneDayInMs = 1000*60*60*24;
  var currentTimeInMs = new Date().getTime();  // UTC time
  var todaySeed = Math.floor(currentTimeInMs / oneDayInMs);
  return todaySeed;
}

function get_todayWord() {
  const generator = seedrandom(get_todaySeed());
  const todayNumber = generator();
  const index = Math.floor(todayNumber*words.length);
  return words[index].trim();
}

function get_randomWord() {
  var currentTimeInMs = new Date().getTime();  // UTC time
  const generator = seedrandom(currentTimeInMs);
  const randomNumber = generator();
  const index = Math.floor(randomNumber*words.length);
  return words[index].trim();
}

// Verify if the user is new and if it is the case create data for him in game_state_json and score
function add_new_user(username,game_state) {
  if (!(username in game_state)) {
    game_state[username] = {
      "word_size": get_todayWord().length,
      "first_letter": get_todayWord()[0],
      "words_tried": [],
      "last_correct_word_found": ""
    }
  
    send_score(username,game_state[username].words_tried.length);
  }
  return game_state;
}

// Add the input of the user to the list of words tried and associate values to letters
// Also send the score to the score server if the word is found.
function add_word(username,todayWord, word, game_state) {
  todayWord = todayWord.trim();
  new_letters = [];
  word = word.trim();
  nb_letter_correct = 0;

  for(var i=0; i<word.length; i++) {
    if (word[i]==todayWord[i]) {
      new_letters.push({[word[i]]:0});
      nb_letter_correct += 1;
    }
    else if (todayWord.includes(word[i])) {
      new_letters.push({[word[i]]:1});
    }
    else {
      new_letters.push({[word[i]]:2});
    }
  }

  game_state[username].words_tried.push({"letters":new_letters});
  
  // If the word is correct send the score to the score server
  if (nb_letter_correct == game_state[username].word_size) {
    game_state[username].last_correct_word_found = word;
    send_score(username,game_state[username].words_tried.length);
  }

  return game_state;
}

function has_won_today(username,game_state) {
  last_correct_word_found = game_state[username].last_correct_word_found;
  todayWord = get_todayWord();
  return (last_correct_word_found == todayWord);
}

function has_lost_today(username) {
  let has_lost_today = false;
  if (!has_won_today(username,game_state_json) && game_state_json[username].words_tried.length >5)
    has_lost_today = true;
  return has_lost_today;
}

function send_score(username,nb_try) {
  axios.post('http://score:4000',
  {
    nb_try: nb_try,
    username: username
  })
  .then(function (response) {
    console.log(response.data);
  })
  .catch(function (error) {
    console.log(error);
  });
}

// JSON variable containing the State of the game
var game_state_json = 
{
  "example": {
    "word_size": get_todayWord().length,
    "first_letter": get_todayWord()[0],
    "words_tried": [],
    "last_correct_word_found": ""
  }
}

// API
app.get('/word', (req, res) => {
  res.send(get_todayWord());
})

const os = require('os');
app.get('/port', (req, res) => {
  res.send("MOTUS APP working on " + os.hostname()+" port "+ port);
})

app.get('/game_state_json', (req, res) => {
  let username = req.session.user; 
  res.send(JSON.stringify(game_state_json[username]));
})

app.get('/session', (req, res) => {
  res.send(JSON.stringify(req.session));
})

// Logout by detroying the session and reloading page
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect("http://localhost:3000/");
})

const jwt = require("jsonwebtoken");
const SECRET = "aaaaa";

// Get the token from authentification server and extract the user to set session.user Then go to motus.
app.get('/get_token', (req, res) => {
  token = req.query.token
  let token_verified = jwt.verify(token, SECRET);
  req.session.user = token_verified.user;
  res.redirect("http://localhost:3000/");
})

// Get the code from authentification server and send it back
app.get('/callback', (req, res) => {
  code = req.query.code
  res.redirect("http://localhost:8080/token?code="+code);
})

// Look if req.session.user exist to redirect user or let him play.
app.use((req,res,next)=>{
  if(req.session.user){
    // Verify if the user is new and if it is the case create data for him in game_state_json and score
    game_state_json = add_new_user(req.session.user,game_state_json);
    next()
  }else{
    res.redirect("http://localhost:8080/authorize?client_id=motus_app&scope=openid,username&redirect_uri=http://localhost:3000/callback");
  }
})

app.get('/has_won_today', (req, res) => {
  res.send(has_won_today(req.session.user,game_state_json));
})

app.get('/has_lost_today', (req, res) => {
  res.send(has_lost_today(req.session.user));
})

app.use(express.json()); // Used to parse JSON bodies
app.use(express.urlencoded()); //Parse URL-encoded bodies

app.post('/', function(req,res){
  let todayWord = get_todayWord();
  let user_word = req.body.word;
  let username = req.session.user;

  if (!has_won_today(username,game_state_json) && game_state_json[username].words_tried.length <6) {
    game_state_json = add_word(username,todayWord,user_word,game_state_json);
  }
  res.json(game_state_json[username]);
});

app.get('/test', (req, res) => {
  res.send(get_randomWord());
})

app.use(express.static(__dirname + '/public'));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
