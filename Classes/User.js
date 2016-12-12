var Sequelize = require('sequelize');
var sequelize = new Sequelize('heroku_1b06a731c23b10d', 'be4f0d9ce8635d', '30c062bc', {host:'localhost', logging:false});
var FactoryORM = require('../Classes/FactoryORM');

var User = (function () {

    var syncUsers = function () {
        return FactoryORM.getORM("User").sync();
    };

    var getUser = function(filter){
        return FactoryORM.getORM('User').findOne({where: filter})
    };

    var createUser = function(arguments){
        arguments.roleId = 2;
        return FactoryORM.getORM('User').create(arguments)
    }
    return {syncUsers: syncUsers, getUser: getUser, createUser:createUser}
})();


module.exports = User;
