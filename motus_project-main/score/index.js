const express = require('express')
const app = express()
const port = process.env.PORT || 4000

// Allow to call this server with a post
app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin','*')
    next()
})

app.use(express.json()); // Used to parse JSON bodies
app.use(express.urlencoded()); //Parse URL-encoded bodies

// Get the json file containing score
const fs = require('fs');
let score_json = JSON.parse(fs.readFileSync('score.json'));

// FUNCTIONS
function modify_score(username,nb_try,score) {
  // If user exists, modify score else create a new user
  if (score[username]) {
    score[username].total_nb_try = parseInt(score[username].total_nb_try) + nb_try;
    score[username].nb_words_found = parseInt(score[username].nb_words_found) + 1;
  }
  else {
    //nb_word_found=0 if user didn't play yet and 1 if he found the good word (nb_try!=0)
    score[username] = {
      total_nb_try: nb_try,
      nb_words_found: nb_try == 0 ? 0 : 1
    }
  }

  let data = JSON.stringify(score, null, 2);
  fs.writeFileSync('score.json', data);
  return score;
}

// API
app.post('/', (req, res) => {
  let nb_try = parseInt(req.body.nb_try);
  let username = req.body.username;

  modify_score(username,nb_try,score_json);
  res.send(JSON.stringify(score_json));
})

const os = require('os');
app.get('/port', (req, res) => {
  res.send("SCORE APP working on " + os.hostname()+" port "+ port);
})

app.get('/score_json', (req, res) => {
  res.send(JSON.stringify(score_json));
})

app.use(express.static(__dirname + '/public'));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
