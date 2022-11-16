window.onload = function() {
    // get username in the url
    var queryStr = window.location.search;
    var paramPairs = queryStr.substr(1).split('&');
    var params = {};
    for (var i = 0; i < paramPairs.length; i++) {
        var parts = paramPairs[i].split('=');
        params[parts[0]] = parts[1];
    }
    update_score(params.username);
};

function update_score(username)
{
    $.get("/score_json", (data)=> {draw_score(username,JSON.parse(data))}) 
}

function draw_score(username,score) {
    $("#nb_word_found").append(score[username]?.nb_words_found ?? 0);
    if (score[username]?.nb_words_found!=0)
        $("#average_try").append((score[username]?.total_nb_try ?? 0)/(score[username]?.nb_words_found ?? 1));
    else
        $("#average_try").append(0);
}