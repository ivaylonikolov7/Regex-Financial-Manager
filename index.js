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
var Promise = require('bluebird');
var notifier = require('mail-notifier');
var VirtualPayee = require('./Classes/VirtualPayee');
var cookieParser = require('cookie-parser')

var imap = {
    username: "regexmailformat@gmail.com",
    password: "pogchamp12",
    host: "imap.gmail.com",
    port: 993, // imap port
    tls:true,
    markSeen: true
};
var hbs = exphbs.create({
    defaultLayout: 'main',
    helpers: {
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
        }
    }
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/static", express.static(__dirname + '/static'));
var secretPhrase = 'mnogotainafraza'
app.use(cookieParser(secretPhrase));

app.get('/', function(req, res)
{
    Record.getAllRecords(function (records)
    {
        for(var i=0; i<records.length; i++)
        {
            var parseDate = Date.parse(records[i].dateBought);
            var newDate = new Date(parseDate);
            var date = newDate.getDate();
            var month = parseInt(newDate.getMonth())+1;
            var formatedDate = newDate.getDate() + "." + month + "." + newDate.getFullYear() + ' ' + newDate.getHours() + ':' + newDate.getMinutes();
            records[i].dateBought = formatedDate;
        }
        if(req.signedCookies['username']!=null) {
            res.render('home', {data: records});
        }
        else{
            res.redirect('/login')
        }

    })

});

app.get('/login', function(req, res) {
    console.log(cookieParser.signedCookie('rememberme', secretPhrase));
    res.render('login');
})

app.post('/login', function(req, res) {
    var user = req.body.username;
    var pass = req.body.password;
    User.getUser({username: user, password: pass})
    .then(function(user)
    {
        if(user!=null)
        {
            res.cookie('username', user.username, {maxAge: 60000, signed:true });
            res.redirect('./');
        }
    })

})

app.get('/register', function(req, res) {
    res.cookie('rememberme', 1, {maxAge: 60000, signed: true});
    res.render('register');
})

app.post('/register', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    console.log(username);
    console.log(password);
    User.getUser({username: username, password:password})
    .then(function(user){
        if(user==null){
            return User.createUser({username: username, password: password})
        }
    })
    .then(function()
    {
        res.redirect('./');
    })
})

app.get('/payees', function(req, res) {

    var payeesFromDatabasePromise = Payee.getAllPayeesNonraw();
    var categoriesFromDatabasePromise = Category.getAllCategories();
    var subcategoriesFromDatabasePromise = Subcategory.getAllSubcategories();

    Promise.all([payeesFromDatabasePromise, categoriesFromDatabasePromise, subcategoriesFromDatabasePromise]).then(function(results)
    {
        var payeesResult = results[0];
        var categoriesResult = results[1];
        var subcategoriesResult = results[2];
        var payeesFormatted = [];

        var payeesCategoriesPromise = []
        var payeesSubcategoriesPromise = []

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
                if (payeesFormatted[index].category.name =="Gifts" || payeesFormatted[index].category.name=="Clothing" || payeesFormatted[index].category.name=='Personal Care')
                {
                    payeesFormatted[index].hideSubcategory = true;
                }
                else
                {
                    payeesFormatted[index].hideSubcategory = false;
                }
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
})

app.get('/get-specific-subcategories', function(req, res)
{
    Subcategory.getAllSubcategoriesWhere({categoryId:req.query.id}).then(function(categories)
    {
        res.send(categories);
    })
})

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
        var payeeObj = {payee: payee, description: description, category: categoryId, subcategory:subcategoryId}
        Payee.editOne(id, payeeObj).then(function(editedPayee)
        {
            console.log(editedPayee)
        })
    }
    res.send('opa');
});
app.post('/post-payees', function(req, res)
{
    var payeesAsJSON = JSON.parse(req.body.payees);
    var payeePromiseList = [];
    var payees = []
    for(var i=0; i<payeesAsJSON.length; i++)
    {

        var name = payeesAsJSON[i].payee;
        var description = payeesAsJSON[i].description;
        var category = payeesAsJSON[i].category;
        var subcategory = payeesAsJSON[i].subcategory;
        payeePromiseList.push(Payee.insertOnePayee(name, description, category, subcategory))
    }
    Promise.each(payeePromiseList, function(payee) {
        payees.push(payee);
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

app.delete('/delete-payee', function(req, res)
{
    var payeeIdForDelete = req.body.id;
    Payee.deleteOnePayee(payeeIdForDelete);
    res.send('deleted');
});

app.delete('/delete-record', function (req, res) {
    var deleteId = req.body.id;
    Record.deleteOneRecord(deleteId).then(function () {
        res.send('opalq');
    })
})

app.post('/post-records', function(req, res) {
    var recordsToAddJSON = JSON.parse(req.body.records);
    var ids = []
    Promise.mapSeries(recordsToAddJSON, function(recordToAddJSON) {
        var date;
        var amount;
        var description;
        var payee;
        var category = null;
        var subcategory = null;
        var correction;
        var note;

        try
        {
            date = recordToAddJSON.date;
            amount = recordToAddJSON.amount;
            description = recordToAddJSON.description;
            payee = recordToAddJSON.payee;
            if (!isNaN(parseInt(recordToAddJSON.category))) {
                category = parseInt(recordToAddJSON.category);
            }
            if (!isNaN(parseInt(recordToAddJSON.subcategory))) {
                subcategory = parseInt(recordToAddJSON.subcategory);
            }
            correction = recordToAddJSON.correction;
            note = recordToAddJSON.note;
        }
        catch(ex) {
            console.log(ex)
        }

        return VirtualPayee.insertPayee({
            payee: payee,
            description: description,
            categoryId:category,
            subcategoryId: subcategory
        }).then(function(payee){
            return Record.insertOneRecordImproved(date, amount, correction, note, payee.id);
        }).then(function(record)
        {
            ids.push(record.id);
        })
    })
    .then(function() {
        res.send(ids);
    });

});

app.get('/records', function(req, res)
{
    Record.getAllRecords().then(function(records) {
        var outputRecordModels = [];
        var outputRecordModel = {};
        Promise.mapSeries(records, function (record) {
            var id = record.id;
            var dateFromBase = record.dateBought;
            var year = dateFromBase.getFullYear();
            var month = dateFromBase.getMonth();
            var dateOfMonth = dateFromBase.getDate();
            var date = pad(year) + '-' + pad(month) + '-' + pad(dateOfMonth);
            var time = pad(dateFromBase.getHours()) + ':' + pad(dateFromBase.getMinutes());
            var amount = record.amount;
            var correction = record.correction;
            var note = record.note;
            var amountValue = null;
            try {
                amountValue = amount.match(/([0-9]+\.?([0-9]{2})?) ?([A-Z]{3})?[ ]?/);
            }
            catch (ex) {
                console.log('Cant match this tuduuu tuduuu cant match this');
            }
            if(record.correction==null) {
                correction = 0;
            }
            else {
                correction = parseFloat(record.correction)
            }
            var expense = (parseFloat(amountValue[1]) + correction).toFixed(2);
            if(correction==0)
            {
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
                expense: expense
            };
            if (record.payeeId != null) {
                return record.getPayee().then(function (payee) {
                    outputRecordModel.payee = {
                        id: payee.id,
                        payee: payee.payee,
                        description: payee.description,
                        category: payee.categoryId,
                        subcategory: payee.subcategoryId
                    }
                    if(outputRecordModel.payee.category == 43 || outputRecordModel.payee.category == 48 || outputRecordModel.payee.category == 50) {
                        outputRecordModel.singleSubcategory = true;
                    }
                    else {
                        outputRecordModel.singleSubcategory = false;
                    }
                    outputRecordModels.push(outputRecordModel);
                });
            }
            if (record.virtualpayeeId != null) {
                return record.getVirtualpayee().then(function (payee) {
                    outputRecordModel.payee = {
                        id: payee.id,
                        payee: payee.payee,
                        description: payee.description,
                        category: payee.categoryId,
                        subcategory: payee.subcategoryId
                    }
                    console.log('category' + outputRecordModel.payee.category);
                    if(outputRecordModel.payee.category == 43 || outputRecordModel.payee.category == 48 || outputRecordModel.payee.category == 50) {
                        outputRecordModel.singleSubcategory = true;
                    }
                    else {
                        outputRecordModel.singleSubcategory = false;
                    }
                    outputRecordModels.push(outputRecordModel);
                });
            }
        })
        .then(function() {
            Promise.all([Category.getAllCategories(), Subcategory.getAllSubcategories()])
                .then(function (results) {
                    var categories = results[0];
                    var subcategories = results[1];
                    if(req.signedCookies['username']!=null)
                    {
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
                                }
                            }
                        })
                    }
                    else
                    {
                        res.redirect('/login');
                    }

            });
        })
    })
});

app.put('/edit-records', function(req,res) {
    var recordsJSON = JSON.parse(req.body.records);
    Promise.mapSeries(recordsJSON, function(recordJSON)
    {
        var recordVirtualPayeeId;
        var date = recordJSON.date;
        var amount = recordJSON.amount;
        var correction = recordJSON.correction;
        var note = recordJSON.note;
        var category = null;
        var subcategory = null;
        return Record.getOneRecord(recordJSON.id).then(function(record)
        {
            var recordVirtualPayeeId = record.virtualpayeeId;
            Record.nullPayeeId(recordJSON.id);
            return VirtualPayee.deletePayee(recordVirtualPayeeId);
        })
        .then(function()
        {
            if (!isNaN(parseInt(recordJSON.category))) {
                category = parseInt(recordJSON.category);
            }
            if (!isNaN(parseInt(recordJSON.subcategory))) {
                subcategory = parseInt(recordJSON.subcategory);
            }
            return VirtualPayee.insertPayee({
                payee: recordJSON.payee,
                description: recordJSON.description,
                categoryId:category,
                subcategoryId:subcategory
            })
        })
        .then(function(virtualPayee)
        {
           return Record.updateById(recordJSON.id, {virtualpayeeId: virtualPayee.id})
        })
        .then(function()
        {
            return Record.updateById(recordJSON.id, {dateBought: date, amount: amount, correction:correction, note: note})
        })
    }, {concurrency:1}).then(function()
    {
        res.send('im done');
    })
})

io.on('connection', function (socket) {

})

notifier(imap).on("mail", function(mail) {
    var mailbody = mail.text;
    mailbody = mailbody.replace(/(\r\n|\n|\r)/gm, " ");
    var regex = /Successful purchase with ([A-Za-z ]+) credit card, amount ([0-9]+\.[0-9]+ [A-Z]{3}) merchant ([A-Za-z0-9 ]*)\. ([0-9]{2}[.][0-9]{2}[.][0-9]{4} [0-9]{2}[:][0-5][0-9])[\.]?/;
    try{
        var results = mailbody.match(regex);
        var regexString = results[0];
        var card = results[1];
        var amount = results[2];
        var payee = results[3];
        var date = results[4];

        Payee.searchForPayees(payee).then(function(payeeModel){
            var payeeModel = payeeModel;
            if(payeeModel == null)
            {
                return Payee.insertOnePayee(payee, null, null)
                .then(function(payee) {
                    var payeeId = payee.id;
                    return Record.insertOneRecord(regexString, card, amount, date, payeeId).then(function(createdRecord) {
                        io.emit('add-new-record',
                            {
                                example:regexString,
                                card: createdRecord.card,
                                amount: createdRecord.amount,
                                date: createdRecord.dateBought,
                            });
                    })
                })
            }
            else {
                var payeeId = payeeModel.id;
                return Record.insertOneRecord(regexString, card, amount, date, payeeId).then(function(createdRecord) {
                    io.emit('add-new-record',
                        {
                            example:regexString,
                            card: createdRecord.card,
                            amount: createdRecord.amount,
                            date: createdRecord.dateBought,
                        });
                })
            }
        })
    }
    catch(e)
    {
        console.log('regex didnt match anything');
    }})
    .start();

function pad(n){return n<10 ? '0'+n : n}

server.listen(port, function()
{
    console.log(process.env.PORT);
    console.log('app listening on port ' + process.env.PORT);
});
