var Sequelize = require('sequelize');
var sequelize = new Sequelize('email_regex', 'root', '', {host:'localhost'});
var FactoryORM = require('../Classes/FactoryORM');


var Payee = (function () {

    var getAllPayees = function(getAllData)
    {
        return FactoryORM.getORM("Payee").sync()
            .then(function() {
                return FactoryORM.getORM("Payee").findAll({raw: true})
            })
    };

    var getAllPayeesNonraw = function(getAllData)
    {
        return FactoryORM.getORM("Payee").sync()
            .then(function() {
                return FactoryORM.getORM("Payee").findAll()
            })
    };
    var searchForPayees = function(payee)
    {
        return FactoryORM.getORM("Payee").findOne({
            where:{
                payee: {$like: '%' + payee + '%'}
            }
        });
    }
    var getAllPayeesWhere = function(raw,filter)
    {
        return FactoryORM.getORM("Payee").findAll({raw: raw, where:filter})
    };

    var insertOnePayee = function(payeeName, description, categoryId, subcategoryId)
    {
        return FactoryORM.getORM("Payee").create({payee: payeeName, description: description,categoryId: categoryId, subcategoryId: subcategoryId});
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
        },
        {
            where: {id: id}
        })
    };

    return {
        getAllPayees : getAllPayees,
        insertOnePayee: insertOnePayee,
        deleteOnePayee: deleteOnePayee,
        getAllPayeesWhere:getAllPayeesWhere,
        editOne:editOne,
        getAllPayeesNonraw:getAllPayeesNonraw,
        searchForPayees: searchForPayees
    }
})();

module.exports = Payee;
