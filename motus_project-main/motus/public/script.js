window.onload = function() {

    // Add the link to score page with username as parameter
    $.get("/session", (data)=> {
        let session = JSON.parse(data);
        let username = session.user;
        
        $("#score_link_container").html(`
            <a href="http://localhost:4000/index.html?username=`+username+`">Page de score</a>
        `);
    })

    // If the user won today display a win message
    $.get("/has_won_today", (data)=> {
        if (data) {
            win_message();
        }
        else {
            // If the user lost today display a lose message
            $.get("/has_lost_today", (data)=> {
                if (data) {
                    lose_message();
                }
                else {
                    // If the user didn't win or lose today, display the input form
                    $("#input_form_container").html(`
                        <form id="input_form">
                            <input type="text" id="user_word" name="user_word" value="" required="required"><br>
                            <input type="submit" name="submit" value="Submit">
                        </form>
                    `)

                    set_form_attribute();
                    // Send the form input with a post
                    $("#input_form").on('submit', function (e) {
                        e.preventDefault(); //stop form submission
                        //ajax call here
                        $.post(
                            "/",    //url
                            {word: $("#user_word").val()}, //value passed
                            (data)=> {
                                draw_game(data);
                                check_score(data);
                            }  //in case of success draw the table
                        )
                    });
                }
            })
        }
    })
    update_game();
};

function update_game()
{
    $.get("/game_state_json", (data)=> {draw_game(JSON.parse(data))}) 
}

function set_form_attribute()
{
    $.get("/game_state_json", (data)=> {verify_input(JSON.parse(data))}) 
}

function win_message() {
    $("#message_container").html("<br><div>Bravo, vous avez trouvé le mot du jour !</div><br>");
}

function lose_message() {
    $("#message_container").html("<br><div>Perdu, vous n'avez pas trouvé le mot du jour. Réessayez demain.</div><br>");
}
function logout() {
    window.location.replace("http://localhost:3000/logout");
}

// Verify that the user enters correct alphanumeric characters
function verify_input(game)
{
    // Set input min and max length
    let input =$("#user_word");
    input.attr("minlength", game.word_size);
    input.attr("maxlength", game.word_size);

    // Remove special and numeric characters 
    input.on('keyup', function(e) {
        var val = $(this).val();
       if (val.match(/[^a-zA-Zéè]/g)) {
           $(this).val(val.replace(/[^a-zA-Zéè]/g, ''));
       }
    });
}

// Check if the word has been found and display win or lose message
function check_score(game) {
    let correct_word = 0;
    let n_try=0;

    // Check if the word has been found
    while (correct_word==0 && n_try<game.words_tried.length) {
        correct_word=1;
        for(var j=0; j<game.word_size; j++) {
            if (Object.values(game.words_tried[n_try].letters[j])[0]!=0) {
                correct_word =0;
            }
        }
        n_try +=1;
    }

    // If the word has been found, display a message and remove the form
    if (correct_word==1) {
        $("#input_form").remove();
        win_message();        
    }
    //If the word hasnt been found but the 6 tries are over display a lose message and remove the form
    else if (game.words_tried.length>5) {
        $("#input_form").remove();
        lose_message();
    }
}

// Draw the table using informations in a json file
function draw_game(game)
{
    let table = $("#motus_table");
    table.empty();
    
    for (var line=0; line<6; line++) {
        table.append("<tr>");
        for(var i=0; i<game.word_size; i++)
        {
            if (line<game.words_tried.length) {
                let row = ""
                switch(Object.values(game.words_tried[line].letters[i])[0]) {
                    case 0:
                        row += "<td class='good_place'> ";
                        break;
                    case 1:
                        row += "<td class='wrong_place'> ";
                        break;
                    default:
                        row += "<td> ";
                }
                table.append(row + Object.keys(game.words_tried[line].letters[i])[0] + " </td>");
            }
            else if (line==0 && game.words_tried.length==0 && i==0)
                table.append("<td class='good_place'> "+ game.first_letter +" </td>");
            else
                table.append("<td> . </td>");
        }
        table.append("</tr>");
    }
}