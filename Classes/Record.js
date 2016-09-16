var Sequelize = require('sequelize');
var sequelize = new Sequelize('email_regex', 'root', '', {host:'localhost'});

var RecordORM = sequelize.define('records', {
    id: {
        type:Sequelize.INTEGER,
        autoIncrement:true,
        primaryKey:true
    },
    card: Sequelize.STRING,
    payee: Sequelize.STRING,
    amount: Sequelize.STRING,
    dateBought: Sequelize.DATE
});

var Record = (function () {


    var getAllRecords = function(getAllData)
    {
        RecordORM.findAll({raw:true}).then(getAllData)
    };

    var insertOneRecord = function(card,amount,payee,dateBought)
    {
        sequelize.sync()
            .then(function () {
                return RecordORM.create({card: card, amount:amount, payee:payee, dateBought:dateBought});
            })
            .then(function(record)
            {
            })
    };

    return {
        getAllRecords : getAllRecords, insertOneRecord: insertOneRecord
    }
})()

module.exports = Record;
