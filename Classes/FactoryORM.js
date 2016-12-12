var Sequelize = require('sequelize');
var sequelize = new Sequelize('email_regex', 'root', '', {host:'localhost', logging:false});

var RegexORM = sequelize.define('regexes', {
    id: {
        type:Sequelize.INTEGER,
        autoIncrement:true,
        primaryKey:true
    },
    regex: Sequelize.STRING,
    amountOrder: Sequelize.INTEGER,
    payeeOrder: Sequelize.INTEGER,
    currencyOrder: Sequelize.INTEGER,
    descriptionOrder: Sequelize.INTEGER,
    cardOrder: Sequelize.INTEGER,
    hourOrder: Sequelize.INTEGER,
    minuteOrder: Sequelize.INTEGER,
    dayOrder: Sequelize.INTEGER,
    monthOrder:Sequelize.INTEGER,
    yearOrder: Sequelize.INTEGER,
    isMonthlyMail: Sequelize.BOOLEAN,
    isTransaction: Sequelize.BOOLEAN,
})

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
    email: Sequelize.STRING
});

UserORM.belongsTo(RolesORM);

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
VirtualPayeeORM.belongsTo(UserORM);

var PayeeORM = sequelize.define('payees', {
    id: {
        type:Sequelize.INTEGER,
        autoIncrement:true,
        primaryKey:true
    },
    payee: Sequelize.STRING,
    description: Sequelize.STRING
});
PayeeORM.belongsTo(UserORM);
PayeeORM.belongsTo(CategoryORM);
PayeeORM.belongsTo(SubcategoryORM);

var RecordORM = sequelize.define('records', {
    id: {
        type:Sequelize.INTEGER,
        autoIncrement:true,
        primaryKey:true
    },
    example: Sequelize.STRING,
    description: Sequelize.STRING,
    card: Sequelize.STRING,
    amount: Sequelize.STRING,
    currency: Sequelize.STRING,
    date: Sequelize.DATEONLY,
    time: Sequelize.TIME,
    correction:  Sequelize.FLOAT,
    note: Sequelize.STRING,
    originalAmount: Sequelize.FLOAT,
    originalCurrency: Sequelize.STRING,
    isTransaction: Sequelize.BOOLEAN,
    status: Sequelize.STRING
});
RecordORM.belongsTo(UserORM);
RecordORM.belongsTo(PayeeORM);
RecordORM.belongsTo(VirtualPayeeORM);


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
            case 'Regex': return RegexORM;
        }
    }
};

module.exports = FactoryORM;