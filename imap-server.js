var notifier = require('mail-notifier');

var imap ={
    username: 'regexmailformat@gmail.com',
    password: 'pogchamp12   ',
    host: 'imap.gmail.com',
    port: 993,
    tls:true,
    markSeen:false
};

notifier(imap).on('connected', function(){
    console.log('svyrzah sa')
}).on('mail', function(mail) {
    var mailbody = mail.text;
    mailbody = mailbody.replace(/(\r\n|\n|\r)/gm, " ");
    var regex = /Successful purchase with ([A-Za-z ]+) credit card, amount ([0-9]+\.[0-9]+ [A-Z]{3}) merchant ([A-Z0-9 ]*)\. ([0-9]{2}[.][0-9]{2}[.][0-9]{4} [0-9]{2}[:][0-5][0-9])[\.]?/;
    try{
        var results = mailbody.match(regex);
        var card = results[1];
        var amount = results[2];
        var payee = results[3];
        var date = results[4];
        var record = new Record(card, amount, payee, date);
        sequelize.sync()
            .then(function () {
                return RecordORM.create({card: card, amount:amount, payee:payee, dateBought:date});
            })
            .then(function(record)
            {
                console.log(record);
            })
    }
    catch(e)
    {
        console.log(e);
    }
}).start();
/**
 * Created by Ivaylo on 16.9.2016 г..
 */
