var express = require('express');
var app = express();
var exphbs = require('express-handlebars');
var Record  = require('./Classes/Record');
var record = Record;
var inbox = require('inbox');

app.engine('handlebars', exphbs({defaultLayout:'main'}));
app.set('view engine', 'handlebars');

app.get('/', function(req, res)
{
    record.getAllRecords(function (records)
    {
        console.log(records );
        res.render('home', {data: records});
    })

});

var client = inbox.createConnection(false, "imap.gmail.com",
    {secureConnection: true, auth: {user:"regexmailformat@gmail.com", pass:"pogchamp12" }});

client.connect();

client.on('connect', function(){
        console.log('We are in');
    });
client.on("new", function(mail) {
    var mailbody = mail.text;
    mailbody = mailbody.replace(/(\r\n|\n|\r)/gm, " ");
    var regex = /Successful purchase with ([A-Za-z ]+) credit card, amount ([0-9]+\.[0-9]+ [A-Z]{3}) merchant ([A-Z0-9 ]*)\. ([0-9]{2}[.][0-9]{2}[.][0-9]{4} [0-9]{2}[:][0-5][0-9])[\.]?/;
    try{
        var results = mailbody.match(regex);
        var card = results[1];
        var amount = results[2];
        var payee = results[3];
        var date = results[4];

        record.insertOneRecord(card, amount, payee, date)
    }
    catch(e)
    {
        console.log('regex didnt match anything');
    }
    });

app.listen(3000, function()
{
    console.log('app listening on port 3000');
});