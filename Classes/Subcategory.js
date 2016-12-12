var Sequelize = require('sequelize');
var sequelize = new Sequelize('heroku_1b06a731c23b10d', 'be4f0d9ce8635d', '30c062bc', {host:'eu-cdbr-west-01.cleardb.com', logging:false});
var FactoryORM = require('../Classes/FactoryORM');

var Subcategory = (function () {
    var getAllSubcategories = function () {
                return FactoryORM.getORM("Subcategory").findAll({raw:true})
        };
    var getAllSubcategoriesWhere = function (filter){
        return FactoryORM.getORM("Subcategory").findAll({raw:true, where: filter})
    };
    var insertSubcategory = function(category,subcategoryname)
    {
        FactoryORM.getORM('Category').sync().then(function() {
            return FactoryORM.getORM("Category").findOne({where:{name: category}, raw:true})
        }).then(function(category) {
            return FactoryORM.getORM('Subcategory').create({name:subcategoryname, categoryId:category.id})
        })
    };
    return {
        getAllSubcategories: getAllSubcategories, insertSubcategory: insertSubcategory, getAllSubcategoriesWhere: getAllSubcategoriesWhere
    }
})();


module.exports = Subcategory;

