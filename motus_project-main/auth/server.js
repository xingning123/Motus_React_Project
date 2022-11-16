let config = require('./config.js');
let app  = require('./index')(config, require('./models/user.js'));

let listener = app.listen(config.port, () => {
    console.log('Listening on port ' + listener.address().port); 
});