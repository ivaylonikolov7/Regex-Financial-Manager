var Sequelize = require('sequelize');
var sequelize = new Sequelize('email_regex', 'root', '', {host:'localhost'});
var FactoryORM = require('../Classes/FactoryORM');


var Record = (function () {


    var getAllRecords = function(getAllData)
    {
        return FactoryORM.getORM("Record").sync()
            .then(function() {
                return FactoryORM.getORM("Record").findAll()
         }).then(getAllData)
    }

    var updateOneRecord = function (record) {
        return FactoryORM.getORM('Record').update(
            {
                amount:record.amount,
                correction: record.correction,
                dateBought: record.date,
                note: record.note,
            }, {where: {id:record.id}})
    }

    var updateById = function (id,updateObj) {
        return FactoryORM.getORM('Record').update(updateObj, {where: {id:id}})
    }

    var nullPayeeId = function (recordId) {
        return FactoryORM.getORM('Record').update({payeeId: null},
        {
            where: {id:recordId}
        });
    }
    var insertOneRecord = function(exampleString, card,amount,dateBought,payeeId)
    {
        var splitDate =  dateBought.match(/([0-9]{2})\.([0-9]{2})\.([0-9]{4}) ([0-9]{2})\:([0-9]+)/)
        var year = splitDate[3];
        var month = parseInt(splitDate[2]);
        var date = parseInt(splitDate[1]);
        var hours = parseInt(splitDate[4]);
        var minutes = parseInt(splitDate[5]);
        var newDate = new Date(year, month, date, hours,minutes)
        return FactoryORM.getORM("Record").sync()
            .then(function () {
                return FactoryORM.getORM("Record").create({example: exampleString, card: card, amount:amount, dateBought:newDate, payeeId: payeeId});
            })
    };

    var insertOneRecordImproved = function(date, amount, correction, note, virtualPayeeId)
    {
        return FactoryORM.getORM("Record").sync()
            .then(function () {
                return FactoryORM.getORM("Record").create(
                    {
                        dateBought: date,
                        amount: amount,
                        virtualpayeeId: virtualPayeeId,
                        note:note,
                        correction:correction,
                        note:note
                    });
            })
    }
    var deleteOneRecord = function (id) {
        return FactoryORM.getORM('Record').destroy({where: {id: id}});
    }

    var getOneRecord = function(id) {
        return FactoryORM.getORM('Record').findOne({where: {id:id}})
    }
    return {
        getAllRecords : getAllRecords,
        insertOneRecord: insertOneRecord,
        deleteOneRecord:deleteOneRecord,
        updateOneRecord:updateOneRecord,
        nullPayeeId:nullPayeeId,
        updateById: updateById,
        getOneRecord: getOneRecord,
        insertOneRecordImproved:insertOneRecordImproved
    }
})()

module.exports = Record;
