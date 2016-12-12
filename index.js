var express = require('express');
var app = express();
var server = require('http').Server(app);
var port = process.env.PORT || 3000;
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var io = require('socket.io')(server);
var Role  = require('./Classes/Role');
var User  = require('./Classes/User');
var Record  = require('./Classes/Record');
var Category = require('./Classes/Category');
var Subcategory = require('./Classes/Subcategory');
var Payee = require('./Classes/Payee');
var Regex = require('./Classes/Regex');
var Promise = require('bluebird');
var notifier = require('mail-notifier');
var VirtualPayee = require('./Classes/VirtualPayee');
var cookieParser = require('cookie-parser');
var RecordsGroupedOutput = require('./Classes/RecordsGroupedOutput');
var fileUpload = require('express-fileupload');
var Excel = require('exceljs');
var request = require('ajax-request');

var imap = {

    username: "regexmailformat@gmail.com",
    password: "pogchamp12",
    host: "imap.gmail.com",
    port: 993, // imap port
    tls:true,
    markSeen:true
};
var hbs = exphbs.create({
    defaultLayout: 'main',
    helpers: {
        getKeys: function(obj){ return obj.keys},
        ifConf: function(v1, operator, v2, options) {
            switch (operator) {
                case '==':
                     if(v1 == v2)  return options.fn(this);
                case '===':
                     if(v1 === v2) return options.fn(this);
                case '<':
                     if(v1 < v2) return options.fn(this);
                case '<=':
                     if(v1 <= v2) return options.fn(this);
                case '>':
                    if(v1 > v2) return options.fn(this);
                case '>=':
                    if(v1 >= v2) return options.fn(this);
                case '&&':
                    if(v1 && v2) return options.fn(this);
                case '||':
                    if(v1 || v2) return options.fn(this);
            }
        },
        getRowSpanLength: function(array){
            return array.length+1;
        },
        parseFloat: function(float){
            return (float!=null) ? (parseFloat(float)).toFixed(2) : ''
        }
    }
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileUpload());
app.use("/static", express.static(__dirname + '/static'));
var secretPhrase = 'mnogotainafraza';
app.use(cookieParser(secretPhrase));


app.get('/logout', function(req, res)
{
    res.clearCookie('username');
    res.clearCookie('userId');
    res.redirect('/')
});
var ifIsLogged = function(req,options){

}
app.get('/login', function(req, res) {
    res.render('login', {
        helpers:{
            ifIsLogged: function(options){
                if(req.signedCookies['userId']!=null){
                    return options.fn(this);
                }
                else{
                    return options.inverse(this)
                }
            }
        }
    });
});

app.post('/login', function(req, res) {
    var user = req.body.username;
    var pass = req.body.password;
    User.getUser({username: user, password: pass})
    .then(function(user)
    {
        if(user!=null)
        {
            res.cookie('username', user.username, {maxAge: 6000*60*60, signed:true });
            res.cookie('userId', user.id, {maxAge: 60000*60*60, signed:true });
            res.redirect('./');
        }
    })

});

app.get('/register', function(req, res) {
    res.cookie('rememberme', 1, {maxAge: 60000, signed: true});
    res.render('register',{
        helpers:{
            ifIsLogged: function(options){
                if(req.signedCookies['userId']!=null){
                    return options.fn(this);
                }
                else{
                    return options.inverse(this)
                }
            }
        }
    });
})

app.post('/register', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;

    User.getUser({username: username, password:password})
    .then(function(user){
        if(user==null){
            return User.createUser({username: username, password: password}) 
        }
    })
    .then(function(){
        res.redirect('./');
    })
    console.log(12)
});

app.get('/payees', function(req, res) {

    var userId = req.signedCookies['userId'];
    var payeesFromDatabasePromise = Payee.getAllPayeesNonraw({userId: userId});
    var categoriesFromDatabasePromise = Category.getAllCategories();
    var subcategoriesFromDatabasePromise = Subcategory.getAllSubcategories();

    Promise.all([payeesFromDatabasePromise, categoriesFromDatabasePromise, subcategoriesFromDatabasePromise]).then(function(results){
        var payeesResult = results[0];
        var categoriesResult = results[1];
        var subcategoriesResult = results[2];
        var payeesFormatted = [];

        var payeesCategoriesPromise = [];
        var payeesSubcategoriesPromise = [];

        for(var i=0; i<payeesResult.length; i++)
        {
            var id = payeesResult[i].id;
            var name = payeesResult[i].payee;
            var description = payeesResult[i].description;
            var categoryId = payeesResult[i].categoryId;
            var subcategoryId = payeesResult[i].subcategoryId;
            var withCategory = false;
            var withSubcategory = false;

            if(categoryId>0)
            {
                withCategory = true;
            }

            if(subcategoryId>0)
            {
                withSubcategory = true;
            }

            payeesCategoriesPromise.push(payeesResult[i].getCategory());
            payeesSubcategoriesPromise.push(payeesResult[i].getSubcategory());

            var payee = {
                id: id,
                payee: name,
                description: description,
                category: {id: categoryId, name: null},
                subcategory: {id: subcategoryId, name:null},
                withCategory: withCategory,
                withSubcategory: withSubcategory
            };

            payeesFormatted.push(payee);
        }

        Promise.each(payeesCategoriesPromise, function(category, index, length)
        {
            try {
                payeesFormatted[index].category.name = category.name;
                payeesFormatted[index].hideSubcategory = !!(payeesFormatted[index].category.name == "Gifts" || payeesFormatted[index].category.name == "Clothing" || payeesFormatted[index].category.name == 'Personal Care');
            }
            catch(ex) {
                console.log('no category');
            }
        })
        .then(function() {
            return Promise.each(payeesSubcategoriesPromise, function (subcategory, index, length) {
                try{
                    payeesFormatted[index].subcategory.name = subcategory.name;
                }
                catch(ex){
                    console.log('no subcategory');
                }
            })
        })
        .then(function()
        {

            if(req.signedCookies['username']!=null)
            {
                res.render('payees', {
                    categories: categoriesResult,
                    subcategories: subcategoriesResult,
                    payees:payeesFormatted,
                    helpers:
                    {
                        showCategoryOptions:  function (category) {
                            var returnCategoryString = '';
                            for(var i=0; i<categoriesResult.length; i++)
                            {
                                if(category != categoriesResult[i].name)
                                {
                                    returnCategoryString+='<option value="' + categoriesResult[i].id + '">' + categoriesResult[i].name + '</option>'
                                }
                                else
                                {
                                    returnCategoryString+='<option value="' + categoriesResult[i].id + '" selected>' + categoriesResult[i].name + '</option>'
                                }
                            }
                            return returnCategoryString;
                        },
                        showSubcategoryOptions: function(subcategory, id) {
                            console.log(subcategory);
                            console.log(id);
                            var returnSubcategoryString = '';
                            for(var i=0; i<subcategoriesResult.length; i++)
                            {
                                if(subcategoriesResult[i].categoryId == id) {
                                    if(subcategory!=subcategoriesResult[i].name) {
                                        returnSubcategoryString+='<option value="' + subcategoriesResult[i].id + '">' + subcategoriesResult[i].name + '</option>'
                                    }
                                    else {
                                        returnSubcategoryString+='<option value="' + subcategoriesResult[i].id + '" selected>' + subcategoriesResult[i].name + '</option>'
                                    }
                                }
                            }
                            return returnSubcategoryString;
                        },
                        ifCondAnd : function(v1, v2, options)
                        {
                            if(v1 && v2)
                            {

                            }
                        },
                        ifIsLogged: function(options){
                            if(req.signedCookies['userId']!=null){
                                return options.fn(this);
                            }
                            else{
                                return options.inverse(this)
                            }
                        }
                    }})
            }
            else
            {
                res.redirect('/login');
            }
        })

    });


});

app.get('/get-categories', function(req, res)
{
    Category.getAllCategories().then(function(categories)
    {
        res.send(categories);
    })
});

app.get('/get-specific-subcategories', function(req, res)
{
    Subcategory.getAllSubcategoriesWhere({categoryId:req.query.id}).then(function(categories)
    {
        res.send(categories);
    })
});

app.get('/get-all-payees', function(req, res)
{
    var categoryReq = req.query.selectedOption;
    Category.getSpecificCategory(categoryReq, function(category)
    {
        category.getSubcategories({raw:true}).then(function(newSubcategories)
        {
            res.send({newSubcategories: newSubcategories})
        })
    })
});
app.put('/edit-payee', function(req, res)
{
    var payeesJSON = JSON.parse(req.body.payees);
    for(var i=0; i<payeesJSON.length; i++)
    {
        var id= parseInt(payeesJSON[i].id);
        var payee = payeesJSON[i].payee;
        var description = payeesJSON[i].description;
        var categoryId = parseInt(payeesJSON[i].category);
        var subcategoryId = parseInt(payeesJSON[i].subcategory);
        if(isNaN(subcategoryId))
        {
            subcategoryId = null;
        }
        var payeeObj = {payee: payee, description: description, category: categoryId, subcategory:subcategoryId};
        Payee.editOne(id, payeeObj).then(function(editedPayee){
            return Promise.resolve(id);
        }).then(function(payeeId){
            return Record.getAllRecords().then(function(records){
                return Promise.mapSeries(records, function(record){                                                
                    if(record.payeeId == payeeId){
                        return VirtualPayee.editVirtualPayeeById(
                            {
                                categoryId: categoryId, 
                                subcategoryId:subcategoryId
                            }, record.virtualpayeeId)
                    }
                    else{
                        return Promise.resolve();
                    }
                })
            })
        })
    }
    res.send('');
});

app.post('/post-payees', function(req, res)
{
    var payeesAsJSON = JSON.parse(req.body.payees);
    var payeePromiseList = [];
    var payees = [];

    Promise.mapSeries(payeesAsJSON, function(payeeAsJSON){
        var name = payeeAsJSON.payee;
        var description = payeeAsJSON.description;
        var category = payeeAsJSON.category;
        var subcategory = payeeAsJSON.subcategory;
        var userId = req.signedCookies['userId'];
        return Payee.insertOnePayee(name, description, category, subcategory, userId).then(function(payee){
            payees.push({id:payee.id, payee: payee.payee, description: payee.description, categoryId: payee.categoryId, subcategoryId: payee.subcategoryId});
            return Record.getAllRecords().then(function (results) {
                return Promise.mapSeries(results, function(record){
                    if(record.virtualpayeeId!=null) {
                        return record.getVirtualpayee().then(function(loopedPayee){
                            if(loopedPayee.payee == payee.payee){
                                return VirtualPayee.deletePayee(loopedPayee.id).then(function(){
                                    return Record.editRecordById(record.id, {virtualpayeeId: null, payeeId: payee.id});
                                })
                            }
                        })
                    }
                })
            })
        })
    })
    .then(function()
    {
        var getCategoriesPromise = Category.getAllCategories();
        var getSubcategoriesPromise = Subcategory.getAllSubcategoriesWhere({});
        Promise.all([getCategoriesPromise,getSubcategoriesPromise]).then(function(results)
        {
            var categories = results[0];
            var subcategories = results[1];
            res.send({payees: JSON.stringify(payees), categories:categories, subcategories:subcategories})
        })
    })
});

app.get('/validate', function(req,res)
{
    if(req.signedCookies['username']!=null){
        res.render('validate', {
        helpers:{
            ifIsLogged: function(options){
                if(req.signedCookies['userId']!=null){
                    return options.fn(this);
                }
                else{
                    return options.inverse(this)
                }
            }
        }})
    }
    else{
        res.redirect('/login');
    }
});

function getWhereAuthorizationAndTransactionStart(worksheet) {
    var authorizationInitialRowNumber;
    var transactionInitialRowNumber;

    worksheet.eachRow(function (row, rowNumber) {
        row.eachCell(function (cell, cellNumber) {
            if (cell.value == 'Авторизации') {
                authorizationInitialRowNumber = rowNumber;
            }
            if (cell.value == 'Транзакции') {
                transactionInitialRowNumber = rowNumber
            }
        })
    });
    return {
        authorizationInitialRowNumber: authorizationInitialRowNumber,
        transactionInitialRowNumber: transactionInitialRowNumber
    };
}

function createAutorizationTable(worksheet, authorizationInitialRowNumber, transactionInitialRowNumber) {
    var authorizationTable = [];
    if(transactionInitialRowNumber == null) {
        transactionInitialRowNumber = worksheet.lastRow.number;
    }
    worksheet.eachRow(function (row, rowNumber) {
        if (rowNumber > authorizationInitialRowNumber + 2 && rowNumber <= transactionInitialRowNumber - 2) {
            authorizationTable.push(row)
        }
    });
    return authorizationTable;
}

function createTransactionTable(worksheet, transactionInitialRowNumber) {
    var transactionTable = [];
    worksheet.eachRow(function (row, rowNumber) {
        if (rowNumber > transactionInitialRowNumber + 2) {
            transactionTable.push(row)
        }
    });
    return transactionTable;
}

function countHowManyOfThisExist(authorization, sameAuthorizationCountExcelArray) {
    var counter = 0;
    sameAuthorizationCountExcelArray.map(function (authorizationIterateArray) {
        if(authorizationIterateArray[0] == authorization[0] && authorizationIterateArray[1] == authorization[1] && authorizationIterateArray[2] == authorization[2]) {
            counter++;
        }
    })

    return counter;
}

function createTransactionAuthorizationArrayFromExcelFile(worksheet) {
    var getStartOfEachObject = getWhereAuthorizationAndTransactionStart(worksheet);
    var authorizationInitialRowNumber = getStartOfEachObject.authorizationInitialRowNumber;
    var transactionInitialRowNumber = getStartOfEachObject.transactionInitialRowNumber;
    var authorizationTableAsExcelRows = createAutorizationTable(worksheet, authorizationInitialRowNumber, transactionInitialRowNumber);
    var transactionTableAsExcelRows = createTransactionTable(worksheet, transactionInitialRowNumber);

    var authorisationTableAsJsArrays = [];
    authorizationTableAsExcelRows.forEach(function (row, rowNumber) {
        var newRow = [];
        row.eachCell(function (cell) {
            newRow.push(cell.value);
        });
        authorisationTableAsJsArrays.push(newRow)
    });

    var transactionTableAsJsArrays = [];
    transactionTableAsExcelRows.forEach(function (row, rowNumber) {
        var newRow = [];
        row.eachCell(function (cell) {
            newRow.push(cell.value)
        });
        transactionTableAsJsArrays.push(newRow)
    });
    return {
        authorisationTableAsJsArrays: authorisationTableAsJsArrays,
        transactionTableAsJsArrays: transactionTableAsJsArrays
    };
}

app.post('/validate', function(req,res)
{
    var userId = req.signedCookies['userId'];
    var excelFile = req.files.excel;
    var excelFileName = excelFile.name;
    excelFile.mv('./excel-files/' + excelFileName, function() {
        var workbook = new Excel.Workbook();
        workbook.xlsx.readFile('./excel-files/' + excelFileName)
        .then(function(excel) {

            var worksheet = excel.getWorksheet(1);
            var transactionAndAuthororizationArrays = createTransactionAuthorizationArrayFromExcelFile(worksheet);
            var authorisationTableAsJsArrays = transactionAndAuthororizationArrays.authorisationTableAsJsArrays;
            var transactionTableAsJsArrays = transactionAndAuthororizationArrays.transactionTableAsJsArrays;


            return Promise.mapSeries(transactionTableAsJsArrays, function(transaction) {
                var unformattedDate = transaction[0];
                var unformattedDay = parseInt(unformattedDate.slice(0,2));
                var unformattedMonth = parseInt(unformattedDate.slice(3, 5));
                var unformattedYear = parseInt(unformattedDate.slice(6, 10));
                var excelDate = new Date(unformattedYear, unformattedMonth-1, unformattedDay,3,0);
                var excelAmount = parseFloat(transaction[1]).toFixed(2);
                var excelDescription = transaction[2];
                var excelPayee = transaction[3];

                var sameAuthorizationExcelArrayCounter = countHowManyOfThisExist(transaction, transactionTableAsJsArrays);
                return Record.insertRecordIfItDoesntExist(
                    {
                        date:excelDate,
                        payee: excelPayee,
                        description: excelDescription,
                        amount: excelAmount,
                        userId: userId,
                        status: 'Reconciled',
                        isTransaction:1
                    },sameAuthorizationExcelArrayCounter, true,false,true);
            }).then(function()
            {
                return Promise.mapSeries(authorisationTableAsJsArrays, function(authorization) {
                    var unformattedDate = authorization[0];
                    var unformattedDay = parseInt(unformattedDate.slice(0,2));
                    var unformattedMonth = parseInt(unformattedDate.slice(3, 5));
                    var unformattedYear = parseInt(unformattedDate.slice(6, 10));
                    var unformattedHours = parseInt(unformattedDate.slice(11, 13));
                    var unformattedMinutes = parseInt(unformattedDate.slice(14, 16));
                    var excelDate = new Date(unformattedYear, unformattedMonth-1, unformattedDay, 3,0);
                    var timeDate =  unformattedHours + ':' + unformattedMinutes + ':' + '00';
                    var originalAmount = null;
                    var originalCurrency = null;
                    var excelAmount = parseFloat(authorization[1]).toFixed(2);
                    try{
                        var result = (authorization[1]).match(/([0-9]*\.[0-9]*)[ ]*\/[ ]*([0-9]*\.[0-9]*)[  ]*([A-Z]{3})/);
                        excelAmount = result[1];
                        originalAmount = result[2];
                        originalCurrency = result[3];
                    }
                    catch(err){
                        console.log('Doesnt have double value for currency')
                    }
                    var excelDescription = authorization[2];
                    var sameAuthorizationExcelArrayCounter = countHowManyOfThisExist(authorization, authorisationTableAsJsArrays);
                    return Record.insertRecordIfItDoesntExist(
                        {
                            date:excelDate,
                            payee: null,
                            description: excelDescription,
                            originalAmount: originalAmount,
                            originalCurrency: originalCurrency,
                            time: timeDate,
                            amount: excelAmount,
                            userId: userId,
                            status: 'Pending',
                            isTransaction:0
                        },sameAuthorizationExcelArrayCounter,false,false,false);
                })
            }).then(function() {
                res.redirect('/');
            })


        })
    })

});

app.delete('/delete-payee', function(req, res) {
    var payeeIdForDelete = req.body.id;
    Payee.deleteOnePayee(payeeIdForDelete);
    res.send('deleted');
});

app.delete('/delete-record', function (req, res) {
    var deleteId = req.body.id;
    Record.getOneRecord(deleteId).then(function (record) {
        var virtualPayeeId = record.virtualpayeeId;
        return Record.deleteOneRecord(deleteId).then(function () {
            if(virtualPayeeId!=null) {
                return VirtualPayee.deletePayee(virtualPayeeId)
            }
        })
        .then(function(){
            res.send('opalq');
        })
    })

});

app.post('/post-records', function(req, res) {
    var recordsToAddJSON = JSON.parse(req.body.records);
    var ids = [];
    var userId = req.signedCookies['userId'];
    Promise.mapSeries(recordsToAddJSON, function(recordToAddJSON) {
        try {
            var unformattedDate = recordToAddJSON.date;
            try{
                var amount = recordToAddJSON.amount;
            }
            catch(ex){
                amount =0
            }
            var description = recordToAddJSON.description;
            var payee = recordToAddJSON.payee;
            var unformattedDay = parseInt(unformattedDate.slice(5,7));
            var unformattedMonth = parseInt(unformattedDate.slice(8, 10));
            var unformattedYear = parseInt(unformattedDate.slice(0, 4));
            var unformattedHours = parseInt(unformattedDate.slice(11, 13));
            var unformattedMinutes = parseInt(unformattedDate.slice(14, 16));
            var date = unformattedYear + '-' + pad(unformattedDay) + '-' + pad(unformattedMonth);
            var time = unformattedHours + ':' + unformattedMinutes + ':00';
            if (!isNaN(parseInt(recordToAddJSON.category))) {
                var category = parseInt(recordToAddJSON.category);
            }
            if (!isNaN(parseInt(recordToAddJSON.subcategory))) {
                var subcategory = parseInt(recordToAddJSON.subcategory);
            }
            var correction = (recordToAddJSON.correction == '') ? null : recordToAddJSON.correction;
            var note = (recordToAddJSON.note == '') ? null : recordToAddJSON.note;
        }
        catch(ex) {
            console.log(ex)
        }
        return Record.insertRecordIfItDoesntExist(
                {
                    payee: payee,
                    description:description,
                    userId: userId,
                    date: date,
                    amount:amount,
                    time: time,
                    categoryId: category,
                    subcategoryId:subcategory,
                    correction: correction,
                    note: note,
                    status:'Reconciled',
                    isTransaction:0
                },1,false,false,false)
        .then(function(record) {
                try {
                    var payeeCategoryId =  record.payee.categoryId;
                    var payeeSubcategoryId = record.payee.subcategoryId;

                }
                catch(ex){
                    console.log('Unable to insert manually record');
                     payeeCategoryId =  null;
                     payeeSubcategoryId = null;
                }
                return Subcategory.getAllSubcategoriesWhere({categoryId: payeeCategoryId}).then(function(subcategories){
                    if(record!=null) {
                        ids.push({id: record.id, categoryId: payeeCategoryId,subcategories:subcategories, subcategoryId: payeeSubcategoryId})
                    }
                })                        
        })
    })
    .then(function() {
        res.send(ids);
    });

});

app.get('/', function(req, res)
{
    var userId = req.signedCookies['userId'];
    Record.getAllRecords({userId: userId}).then(function(records) {
        var outputRecordModels = [];
        var outputRecordModel = {};
        Promise.mapSeries(records, function (record) {
            var id = record.id;
            var dateFromBase = record.date;
            var timeFromBase = record.time;
            try{
                var year = dateFromBase.getFullYear();
                var month = dateFromBase.getMonth()+1;
                var dateOfMonth = dateFromBase.getDate();
                var date = pad(year) + '-' + pad(month) + '-' + pad(dateOfMonth);
                var hours = (timeFromBase.split(':')[0]);
                var minutes = timeFromBase.split(':')[1];
                var time = pad(hours) + ':' + pad(minutes);
            }
            catch (ex){
                console.log(ex);
            }
            var amount = record.amount;
            var correction = record.correction;
            var originalAmount = record.originalAmount;
            var originalCurrency = record.originalCurrency;
            var note = record.note;
            var description = record.description;
            var status = record.status;
            var amountValue = 0;
            try {
                amountValue = amount.match(/([0-9]+\.?([0-9]{2})?) ?([A-Z]{3})?[ ]?/);
            }
            catch (ex) {
                console.log('Cant match this');
            }
            correction = record.correction == null ? 0 : parseFloat(record.correction);
            try {
                var expense = (parseFloat(amountValue[1]) + correction).toFixed(2);
            }
            catch(ex) {
                expense = parseFloat(0).toFixed(2)
            }
            if(correction==0) {
                correction=null;
            }
            outputRecordModel = {
                id: id,
                date: date,
                time: time,
                amount: amount,
                payee: null,
                correction: correction,
                note: note,
                expense: expense,
                description: description,
                status: status,
                originalAmount: originalAmount,
                originalCurrency: originalCurrency,
            };


            return record.getVirtualpayee().then(function (payee) {
                outputRecordModel.payee = {
                    id: payee.id,
                    payee: payee.payee,
                    category: payee.categoryId,
                    subcategory: payee.subcategoryId
                };
                outputRecordModel.singleSubcategory = !!(outputRecordModel.payee.category == 43 || outputRecordModel.payee.category == 48 || outputRecordModel.payee.category == 50);
                outputRecordModels.push(outputRecordModel);
            });
            
        })
        .then(function() {
            Promise.all([Category.getAllCategories(), Subcategory.getAllSubcategories()])
            .then(function (results) {
                var categories = results[0];
                var subcategories = results[1];
                if(req.signedCookies['username']!=null) {
                    res.render('records', {
                        outputRecordModels: outputRecordModels, helpers: {
                            showCategoryOptions: function (id) {
                                var returnCategoryString = '';
                                for (var i = 0; i < categories.length; i++) {
                                    if (categories[i].id == id) {
                                        returnCategoryString += '<option value="' + categories[i].id + '" selected>' + categories[i].name + '</option>';
                                    }
                                    else {
                                        returnCategoryString += '<option value="' + categories[i].id + '">' + categories[i].name + '</option>';
                                    }
                                }
                                return returnCategoryString;
                            },
                            showSubcategoryOptions: function (categoryId, subcategoryId) {
                                var returnSubcategoryString = '';
                                for (var i = 0; i < subcategories.length; i++) {
                                    if (categoryId == subcategories[i].categoryId) {
                                        if (subcategories[i].id == subcategoryId) {
                                            returnSubcategoryString += '<option value="' + subcategories[i].id + '" selected>' + subcategories[i].name + '</option>';
                                        }
                                        else {
                                            returnSubcategoryString += '<option value="' + subcategories[i].id + '">' + subcategories[i].name + '</option>';
                                        }
                                    }
                                }
                                return returnSubcategoryString;
                            },
                            ifIsLogged: function(options){
                                if(req.signedCookies['userId']!=null){
                                    return options.fn(this);
                                }
                                else{
                                    return options.inverse(this)
                                }
                            }
                        }
                    })
                }
                else {
                    res.redirect('/login');
                }
            });
        })
    })
});

app.put('/edit-records', function(req,res) {
    var recordsJSON = JSON.parse(req.body.records);
    var userId = req.signedCookies['userId'];
    var recordsOutput = []
    Promise.mapSeries(recordsJSON, function(recordJSON)
    {
        var dateString = recordJSON.date;
        var year = dateString.slice(0,4);
        var dayOfMonth = dateString.slice(5,7);
        var month = dateString.slice(8,10);
        var hours = dateString.slice(11, 13)
        var minutes = dateString.slice(14, 16)
        if (month && year && dayOfMonth) {
            var onlyDate = year + '-' + dayOfMonth + '-' + month;
        }
        if (hours && minutes) {
            var onlyTime = hours + ':' + minutes + ':00';
        }       
        var amount = recordJSON.amount;
        var description = recordJSON.description;
        var correction = (recordJSON.correction == '') ? null : recordJSON.correction;
        var note = (recordJSON.note == '') ? null : recordJSON.note;
        var category = null;
        var subcategory = null;
        if (!isNaN(parseInt(recordJSON.category))) {
            category = parseInt(recordJSON.category);
        }
        if (!isNaN(parseInt(recordJSON.subcategory))) {
            subcategory = parseInt(recordJSON.subcategory);
        }

        return Record.getOneRecord(recordJSON.id).then(function(record) {
            var recordVirtualPayeeId = record.virtualpayeeId;

            var newRecord = {
                id: record.id,
                date: onlyDate,
                time: onlyTime,
                amount: amount,
                description:description,
                correction: correction,
                note: note,
                categoryId: category,
                subcategoryId: subcategory
            }

            return VirtualPayee.editPayeeById(recordVirtualPayeeId,{
                payee: recordJSON.payee,
                categoryId:category,
                subcategoryId:subcategory
            }, newRecord, userId).then(function () {
                return Record.updateById(record.id, newRecord)
            })
            .then(function(){
                return Record.getRecordInnerJoined(record.id,userId).then(function(record) {
                    return Subcategory.getAllSubcategoriesWhere({categoryId: record.virtualpayee.categoryId}).then(function(subcategories)
                    {
                        recordsOutput.push({
                            id: record.id,
                            subcategories: subcategories,
                            categoryId: record.virtualpayee.categoryId,
                            subcategoryId: record.virtualpayee.subcategoryId
                        })
                    })
                });
            })
        })
    }).then(function() {
        res.send(recordsOutput);
    })
});

app.get('/pivot', function (req, res) {
    var userId = req.signedCookies['userId'];
    var recordsGroupedOutput = new RecordsGroupedOutput();
    return Record.groupByCategoriesAndSubcategories(userId).then(function (records) {        
        records.map(function (recordFromBase) {
            recordsGroupedOutput.addRecord(recordFromBase);
        })
        var categoriesWithSubcategoriesLength = recordsGroupedOutput.categoriesWithSubcategories.length;
        for(var i= 0; i<categoriesWithSubcategoriesLength; i++){
            var currentCategoryWithSubcategory = recordsGroupedOutput.categoriesWithSubcategories[i];
            var globalMonthKeys = Object.keys(recordsGroupedOutput.months);
            var subcategories = currentCategoryWithSubcategory.subcategories;
            for(var j=0; j<subcategories.length; j++){
                var subcategory = subcategories[j];
                var monthsInCurrentSubcategory = subcategory.amount.months;
                for(var k=0; k<globalMonthKeys.length; k++){
                    var currentSubcategoryMonthKeys = Object.keys(monthsInCurrentSubcategory);
                    var currentGlobalMonthKey = globalMonthKeys[k];
                    if(currentSubcategoryMonthKeys.indexOf(currentGlobalMonthKey)==-1){
                        var newKey = currentGlobalMonthKey;
                        recordsGroupedOutput.categoriesWithSubcategories[i].subcategories[j].amount.months[newKey]=null;
                    }
                }
            }
            for(var j=0; j<globalMonthKeys.length; j++){
                var currentCategoryWithSubcategoryMonthKeys = Object.keys(currentCategoryWithSubcategory.amountByCategory.monthsInCategory);
                var currentGlobalMonthKey = globalMonthKeys[j];
                if(currentCategoryWithSubcategoryMonthKeys.indexOf(currentGlobalMonthKey)==-1){
                    var newKey = currentGlobalMonthKey;
                    recordsGroupedOutput.categoriesWithSubcategories[i].amountByCategory.monthsInCategory[newKey]=null;
                }
            }
        }
        res.render('pivot', {results:recordsGroupedOutput,helpers:{
            ifIsLogged: function(options){
                if(req.signedCookies['userId']!=null){
                    return options.fn(this);
                }
                else{
                    return options.inverse(this)
                }
            },
            showCategory: function(category,options){
                if(category=='No category' || category=='Gifts' || category=='Personal Care' || category =='Clothing'){

                    return options.inverse(this);
                }
                else{
                    return options.fn(this);
                }
            }
        }
        });
    })   
})

function getRegexMatchesArray(regex, mailBody) {
    try {
        var matchesArray = [];
        var matches = regex.exec(mailBody);
        while (matches != null) {
            var temporaryArray =[];
            matches.map(function(match) {
                temporaryArray.push(match)
            });
            matchesArray.push(temporaryArray);
            matches = regex.exec(mailBody);
        }
    }
    catch (e) {
        console.log('regex didnt match anything');
    }
    return matchesArray;
}

function getCurrencyFromDescription(description) {
    var results = description.match('([0-9]+\.[0-9]+)[ ]*([A-Z]{3})');
    if(results != null) {
        var originalAmount = results[1];
        var originalCurrency = results[2]
    }
    return {originalAmount: originalAmount, originalCurrency: originalCurrency}
}

function makeAjaxRequest(obj) {
    // 1 - Create a new Promise
    return new Promise(function (resolve, reject) {
        // 2 - Copy-paste your code inside this function
            request(obj, function (err, res, result) {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(result));
            }
        });
    });
}

notifier(imap).on("mail", function(mail) {
    var mailBody = mail.text;
    var mailFrom = mail.from[0].address;
    Regex.getAllRegexes().then(function(regexpressions) {
        return Promise.mapSeries(regexpressions, function(regexBase){
            var regex = new RegExp(regexBase.regex, 'gm');
            var mailMatchesArray = getRegexMatchesArray(regex, mailBody);
            if(mailMatchesArray.length==0) {
                return Promise.resolve('продължаваме напред')
            }

            return Promise.mapSeries(mailMatchesArray, function(match) {
                var payee = match[regexBase.payeeOrder];
                var amount = parseFloat(match[regexBase.amountOrder]).toFixed(2);
                var year = parseInt(match[regexBase.yearOrder]);
                var description = match[regexBase.descriptionOrder];
                var originalCurrencyAndAmountFromDescription = getCurrencyFromDescription(description);
                var originalCurrencyFromDescription = originalCurrencyAndAmountFromDescription.originalCurrency;
                var originalAmountFromDescription = originalCurrencyAndAmountFromDescription.originalAmount;            
                var month = parseInt(match[regexBase.monthOrder])-1;
                var dateOfMonth = parseInt(match[regexBase.dayOrder]);
                var hours = parseInt(match[regexBase.hourOrder]);
                var minutes = parseInt(match[regexBase.minuteOrder])
                var currency = match[regexBase.currencyOrder] || 'BGN';
                var dateString = year + '-' + pad(month) + '-' + pad(dateOfMonth);
                var isMonthlyMail = regexBase.isMonthlyMail;
                var isTransaction = regexBase.isTransaction;
                var newDate = new Date(year, month, dateOfMonth,3,0);
                var timeDate = (isNaN(hours) && isNaN(minutes)) ? null : hours + ':' + minutes + ':00';
                var counter = mailMatchesCounter(match, mailMatchesArray);
                var status = (isMonthlyMail == 1) ? 'Reconciled' : 'Pending';
                return User.getUser({ email: mailFrom }).then(function(user)
                {
                    if(originalCurrencyFromDescription==null && currency!='BGN'){
                        var requestObject = {
                            url:'http://api.fixer.io/latest', method:'GET',
                            data:{
                                base: currency
                            }
                        }

                        return makeAjaxRequest(requestObject).then(function(data){
                            var originalAmount = amount;
                            var originalCurrency = currency;
                            amount=(amount*data.rates['BGN']).toFixed(2);
                            var recordObj = {
                                date: newDate,
                                time: timeDate,
                                payee: payee,
                                amount: amount,
                                userId: user.id,
                                currency: 'BGN',
                                description: description,
                                originalCurrency: originalCurrency,
                                originalAmount: originalAmount,
                                status: status,
                                isTransaction: isTransaction}
                            return Record.insertRecordIfItDoesntExist(recordObj, counter, isMonthlyMail, false, false)
                        })
                    }
                    if(originalCurrencyFromDescription!=null && currency!='BGN')
                    {
                        var requestObject = {
                            url:'http://apilayer.net/api/historical', method:'GET',
                            data:{
                                access_key: 'f4c7e3be8a1261d04c8e33a22e4621d1',
                                date: dateString,
                                currencies: originalCurrencyFromDescription,
                                source: currency,
                            }
                        }
                        return makeAjaxRequest(requestObject)
                        .then(function(data){
                            amount=(originalAmountFromDescription*data.quotes[currency+'BGN']).toFixed(2);
                            var recordObj = {
                                date: newDate,
                                time: timeDate,
                                payee: payee,
                                amount: amount,
                                userId: user.id,
                                currency: 'BGN',
                                description: description,
                                originalCurrency: originalCurrencyFromDescription,
                                originalAmount: originalAmountFromDescription,
                                status: status,
                                isTransaction: isTransaction}
                            return Record.insertRecordIfItDoesntExist(recordObj, counter, isMonthlyMail, false,false)
                        })
                    }
                    if(originalCurrencyFromDescription==null && currency=='BGN'){
                        amount = parseFloat(amount).toFixed(2);
                        var recordObj = {
                                date: newDate,
                                time: timeDate,
                                payee: payee,
                                amount: amount,
                                userId: user.id,
                                currency: 'BGN',
                                description: description,
                                originalCurrency: originalCurrencyFromDescription,
                                originalAmount: originalAmountFromDescription,
                                status: status,
                                isTransaction: isTransaction
                            }

                        return Record.insertRecordIfItDoesntExist(recordObj, counter, isMonthlyMail, false, false)
                    }  
                })
                 
            })                     
        })
    })
})
.start();

function mailMatchesCounter(match, sameAuthorizationCountExcelArray){
    var counter = 0;
    sameAuthorizationCountExcelArray.map(function (authorizationIterateArray) {
        if(match[1] == authorizationIterateArray[1] && match[2] == authorizationIterateArray[2] && match[3] == authorizationIterateArray[3] && match[4] == authorizationIterateArray[4] && match[5] == authorizationIterateArray[5]) {
            counter++;
        }
    })
    return counter
}

function pad(n){var parsedN = parseInt(n); return (parsedN<10) ? '0'+parsedN : parsedN.toString()}

server.listen(82, function()
{
    console.log('app listening on port ' + (82));
});
