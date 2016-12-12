var Sequelize = require('sequelize');
var sequelize = new Sequelize('heroku_1b06a731c23b10d', 'be4f0d9ce8635d', '30c062bc', {host:'localhost', logging:false});
var FactoryORM = require('../Classes/FactoryORM');


var Category = (function () {
    var getAllCategories = function(){
        return FactoryORM.getORM('Category').findAll()
    };
    var insertCategory = function(categoryName) {
        sequelize.sync().then(function() {
            return FactoryORM.getORM('Category').create({name: categoryName})
        })
    };
    var getSpecificCategory = function(categoryName, hasCategoryCallback) {
        FactoryORM.getORM('Category').sync().then(function(){
            return FactoryORM.getORM('Category').findOne({where: {name:categoryName}})
                .then(hasCategoryCallback)
        })
    };
    return {
        getAllCategories: getAllCategories,
        insertCategory: insertCategory,
        getSpecificCategory:getSpecificCategory
    }
})();

module.exports = Category;
