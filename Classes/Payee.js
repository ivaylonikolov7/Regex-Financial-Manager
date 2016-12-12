var Sequelize = require('sequelize');
var sequelize = new Sequelize('heroku_1b06a731c23b10d', 'be4f0d9ce8635d', '30c062bc', {host:'eu-cdbr-west-01.cleardb.com', logging:false});
var FactoryORM = require('../Classes/FactoryORM');
var Promise = require('bluebird');

var Payee = (function () {

    if (typeof String.prototype.contains === 'undefined') { String.prototype.contains = function(it) { return this.indexOf(it) != -1; }; }

    var getAllPayees = function(getAllData)
    {
        return FactoryORM.getORM("Payee").sync()
            .then(function() {
                return FactoryORM.getORM("Payee").findAll({raw: true})
            })
    };

    var getAllPayeesNonraw = function(filter) {
        return FactoryORM.getORM("Payee").findAll({where: filter})
    };
    var searchForPayees = function(payee)
    {
        return FactoryORM.getORM("Payee").findOne({
            where:{
                payee: {$like: '%' + payee + '%'}
            }
        });
    }

    var searchForPayeesWithUserId = function(originalPayee,originalDescription, userId) {
        return FactoryORM.getORM("Payee").findAll({
            where:{
                userId: userId
            }
        }).then(function(payees){
            var returnPayee = null;
           payees.map(function(payee){
               currentlyLoopedPayeeDescription = (payee.description=='') ? null : payee.description;
               currentlyLoopedPayeeName = (payee.payee=='') ? null : payee.payee;
               if((originalPayee || "").contains(currentlyLoopedPayeeName) 
               || (originalPayee|| "").contains(currentlyLoopedPayeeDescription) 
               || (originalDescription || '').contains(currentlyLoopedPayeeName)
                || (originalDescription || '').contains(currentlyLoopedPayeeDescription)){
                   returnPayee = payee;
               }
           })
            return Promise.resolve(returnPayee);
        })
    }

    var getAllPayeesWhere = function(raw,filter)
    {
        return FactoryORM.getORM("Payee").findAll({raw: raw, where:filter})
    };

    var insertOnePayee = function(payeeName, description, categoryId, subcategoryId, userId)
    {
        return FactoryORM.getORM("Payee").create({payee: payeeName, description: description,categoryId: categoryId, subcategoryId: subcategoryId, userId:userId});
    };

    var deleteOnePayee = function(id)
    {
        FactoryORM.getORM("Payee").sync()
            .then(function () {
                return FactoryORM.getORM('Payee').destroy({where: {id:id}})
            })
    }

    var editOne = function(id, data)
    {
        return FactoryORM.getORM("Payee").update({
            payee: data.payee,
            description: data.description,
            categoryId: data.category,
            subcategoryId: data.subcategory
        }, {where: {id: id}})
    };

    return {
        getAllPayees : getAllPayees,
        insertOnePayee: insertOnePayee,
        deleteOnePayee: deleteOnePayee,
        getAllPayeesWhere:getAllPayeesWhere,
        editOne:editOne,
        getAllPayeesNonraw:getAllPayeesNonraw,
        searchForPayees: searchForPayees,
        searchForPayeesWithUserId: searchForPayeesWithUserId
    }
})();

module.exports = Payee;
