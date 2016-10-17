var Sequelize = require('sequelize');
var sequelize = new Sequelize('email_regex', 'root', '', {host:'localhost'});

var SubcategoryORM = sequelize.define('subcategories', {
    id: {
        type:Sequelize.INTEGER,
        autoIncrement:true,
        primaryKey:true
    },
    name: Sequelize.STRING
});

var CategoryORM = sequelize.define('categories', {
    id: {
        type:Sequelize.INTEGER,
        autoIncrement:true,
        primaryKey:true
    },
    name: Sequelize.STRING
});

CategoryORM.hasMany(SubcategoryORM);

var VirtualPayeeORM = sequelize.define('virtualpayees', {
    id: {
        type:Sequelize.INTEGER,
        autoIncrement:true,
        primaryKey:true
    },
    payee: Sequelize.STRING,
    description: Sequelize.STRING
});

VirtualPayeeORM.belongsTo(CategoryORM);
VirtualPayeeORM.belongsTo(SubcategoryORM);


var PayeeORM = sequelize.define('payees', {
    id: {
        type:Sequelize.INTEGER,
        autoIncrement:true,
        primaryKey:true
    },
    payee: Sequelize.STRING,
    description: Sequelize.STRING
});

PayeeORM.belongsTo(CategoryORM);
PayeeORM.belongsTo(SubcategoryORM);

var RecordORM = sequelize.define('records', {
    id: {
        type:Sequelize.INTEGER,
        autoIncrement:true,
        primaryKey:true
    },
    example: Sequelize.STRING,
    card: Sequelize.STRING,
    amount: Sequelize.STRING,
    dateBought: Sequelize.DATE,
    correction:  Sequelize.FLOAT,
    note: Sequelize.STRING
});

RecordORM.belongsTo(PayeeORM);
RecordORM.belongsTo(VirtualPayeeORM);

var RolesORM = sequelize.define('roles', {
    id: {
        type:Sequelize.INTEGER,
        autoIncrement:true,
        primaryKey:true
    },
    name: Sequelize.STRING,
})

var UserORM = sequelize.define('users', {
    id: {
        type:Sequelize.INTEGER,
        autoIncrement:true,
        primaryKey:true
    },
    username: Sequelize.STRING,
    password: Sequelize.STRING,
});

UserORM.belongsTo(RolesORM);

var FactoryORM = {
    getORM: function (categoryORM) {
        switch(categoryORM)
        {
            case 'Record': return RecordORM;
            case 'Subcategory': return SubcategoryORM;
            case 'Category' : return CategoryORM;
            case 'Payee' : return PayeeORM;
            case 'VirtualPayee' : return VirtualPayeeORM;
            case 'User' : return UserORM;
            case 'Role': return RolesORM;
        }
    }
};

module.exports = FactoryORM;