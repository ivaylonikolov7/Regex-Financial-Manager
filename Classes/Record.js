var FactoryORM = require('../Classes/FactoryORM');
var Promise = require('bluebird');
var Payee = require('../Classes/Payee');
var VirtualPayee = require('../Classes/VirtualPayee');

var Record = (function () {
    if (typeof String.prototype.contains === 'undefined') { String.prototype.contains = function(it) { return this.indexOf(it) != -1; }; }

    var getAllRecords = function(filter, orderByDateAndTime)
    {
        return FactoryORM.getORM("Record").sync()
        .then(function() {
            return FactoryORM.getORM("Record").findAll({where: filter, order: 'date DESC' })
         })
    }

    var getRecordInnerJoined = function (recordId, userId) {
        return FactoryORM.getORM('Record').findOne({
            where: {userId: userId, id: recordId},
            include: [{
                model: FactoryORM.getORM('VirtualPayee')
            }],
        })
    }
    var updateOneRecord = function (record) {
        return FactoryORM.getORM('Record').update(
            {
                amount:record.amount,
                correction: record.correction,
                date: record.date,
                time: record.time,
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

    var insertOneRecord = function(exampleString,card,isTransaction,status,description,dateBought,time,amount,currency,originalCurrency, originalAmount,correction,note,payee,userId) {
        return FactoryORM.getORM("Record").sync()
            .then(function () {
                return FactoryORM.getORM("Record").create({
                    example: exampleString,
                    description: description,
                    card: card,
                    amount:amount,
                    date: dateBought,
                    time: time,
                    payeeId:payee.payeeId,
                    virtualpayeeId: payee.virtualpayeeId,
                    userId: userId,
                    currency: currency,
                    isAuthorization:0,
                    originalCurrency: originalCurrency,
                    originalAmount: originalAmount,
                    status: status,
                    isTransaction: isTransaction
                });
            })
    };

    var deleteOneRecord = function (id) {
        return FactoryORM.getORM('Record').destroy({where: {id: id}});
    }

    var getOneRecord = function(id) {
        return FactoryORM.getORM('Record').findOne({where: {id:id}})
    }

    function getAllRecordsInnerJoined(recordToCheck) {
        return FactoryORM.getORM('Record').findAll({
            include: [{
                model: FactoryORM.getORM('VirtualPayee')
            }, {
                model: FactoryORM.getORM('Payee')
            }],
            where: {
                date: recordToCheck.date,
                userId: recordToCheck.userId
            }
        })
    }

    function returnRecordsCounter(recordsFromBase, recordToCheck) {
        var counter = 0;
        recordsFromBase.map(function (recordFromBase) {
            var virutalPayee = recordFromBase.virtualpayee.payee || '';
            var virtualDescription = recordFromBase.virtualpayee.description || '';
            if (virutalPayee.contains(recordToCheck.payee) || (virutalPayee).contains(recordToCheck.description) || (virtualDescription).contains(recordToCheck.payee)) {
                counter++
            }
        });
        return counter;
    }

    var findOneRecordIfDescContainsPayee = function (recordFromMonthlyMail) {
        return FactoryORM.getORM('Record').findAll({where: {date: recordFromMonthlyMail.date}, include:[FactoryORM.getORM('Payee'), FactoryORM.getORM('VirtualPayee')]})
            .then(function(recordsFromBase){
            var foundRecord = null;
            recordsFromBase.map(function (recordFromBase) {
                var virutalPayeeFromBase = recordFromBase.virtualpayee.payee || '';
                var virtualDescriptionFromBase = recordFromBase.description || '';
                if (virutalPayeeFromBase.contains(recordFromMonthlyMail.payee) || virutalPayeeFromBase.contains(recordFromMonthlyMail.description) || virtualDescriptionFromBase.contains(recordFromMonthlyMail.payee) || virtualDescriptionFromBase.contains(recordFromMonthlyMail.description)){
                    foundRecord = recordFromBase;
                }

            })
            return Promise.resolve(foundRecord);
        })
    };
    var findOneOrCreate = function(record) {
        return FactoryORM.getORM('Payee').findOne({where: {payee: record.payee, userId: record.userId}}).then(function (payee) {
            if(payee!=null) {
                return FactoryORM.getORM('Record').findOrCreate({
                    where: {
                        amount: record.amount,
                        date: record.date,
                        payeeId: payee.id,
                        userId: record.userId
                    },
                    defaults: {
                        amount: record.amount,
                        date: record.date,
                        time: record.time,
                        payeeId: payee.id,
                        userId: record.userId,
                    }
                })
            }
            else {
                return FactoryORM.getORM('Record').findAll({where: {userId: record.userId}}).then(function(records){
                    var recordExists = false;
                    return Promise.mapSeries(records, function (mapRecord) {
                        return mapRecord.getVirtualpayee().then(function(payee) {
                            if(payee!=null) {
                                if(payee.payee==record.payee &&
                                    record.amount == mapRecord.amount &&
                                    record.date.getFullYear() == mapRecord.date.getFullYear() &&
                                    record.date.getMonth() == mapRecord.date.getMonth() &&
                                    record.date.getDate() == mapRecord.date.getDate()){
                                    recordExists = true;
                                    return Promise.resolve('nope');
                                }
                                else {
                                    return Promise.resolve('null')
                                }
                            }
                        })
                    }).then(function () {
                        if(recordExists==false) {
                            return FactoryORM.getORM('VirtualPayee').create({payee: record.payee}).then(function(virtualPayeeId) {
                                return FactoryORM.getORM('Record').create({virtualpayeeId: virtualPayeeId.id, amount:record.amount, date: record.date, time: record.time,userId: record.userId})
                            })
                        }
                        else {
                            return Promise.resolve('oops');
                        }
                    })
                })
            }
        })
    }

    var findOneRecordAndUpdatePayeeNameIfNeeded = function (newRecord, userId) {
        return FactoryORM.getORM('Record').findAll({include: [{model:FactoryORM.getORM('Payee')}, {model: FactoryORM.getORM('VirtualPayee')}], where: {amount: newRecord.amount, date: newRecord.date, userId: userId, description: newRecord.description }})
        .then(function(records){
            return Promise.mapSeries(records,function(record){
                return record.getVirtualpayee().then(function(virtualPayee){
                    if(virtualPayee.payee=="") {
                        virtualPayee.payee = newRecord.payee;
                        return virtualPayee.save();
                    }
                    else {
                        return Promise.resolve('ok');
                    }
                })

            })
        })
    }
    
    var insertRecordIfItDoesntExist = function(recordToCheck, numberOfRecordsExcel,shouldOverrideAmount,shouldOverridePayee, isValidationAndIsTransaction){
        try {
            var correction = (recordToCheck.correction) ? recordToCheck.correction : null;
            var note = (recordToCheck.note) ? recordToCheck.note : null;
            var originalCurrency = (recordToCheck.originalCurrency) ? recordToCheck.originalCurrency : null;
            var originalAmount = (recordToCheck.originalAmount) ? recordToCheck.originalAmount : null;
        }
        catch(ex) {
            console.log('no correction or note')
        }
        var status = recordToCheck.status;
        var isTransaction = recordToCheck.isTransaction;
        var currentThis = this;
        return getAllRecordsInnerJoined(recordToCheck).then(function (recordsFromBase) {
            var sameRecordsCounter = returnRecordsCounter(recordsFromBase, recordToCheck);
            if (sameRecordsCounter >= numberOfRecordsExcel) {
                var findRecord = {
                    date: recordToCheck.date,
                    amount:recordToCheck.amount,
                    payee:recordToCheck.payee,
                    description:recordToCheck.description,
                    userId: recordToCheck.userId
                };
                return currentThis.findOneRecordByObject(findRecord).then(function(record){
                    if(isValidationAndIsTransaction==true){
                        record.status='Reconciled';
                    }
                    if (shouldOverrideAmount == true) {                    
                        record.amount = recordToCheck.amount;                            
                    }
                    return record.save();                                
                })
                
            }
            else {
                return Payee.searchForPayeesWithUserId(recordToCheck.payee,recordToCheck.description, recordToCheck.userId).then(function (payee) {
                    if (payee == null) {
                        if(recordToCheck.payee != null && recordToCheck.description !=null) {
                            return Payee.insertOnePayee(recordToCheck.payee, recordToCheck.description, recordToCheck.categoryId, recordToCheck.subcategoryId, recordToCheck.userId).then(function (payee) {
                                return FactoryORM.getORM('VirtualPayee').create({
                                    payee: recordToCheck.payee,
                                    description: recordToCheck.description,
                                    categoryId: recordToCheck.categoryId,
                                    subcategoryId: recordToCheck.subcategoryId,
                                    userId: recordToCheck.userId
                                })
                                    .then(function (virtualPayee) {
                                        return currentThis.insertOneRecord(null, null, isTransaction, status, recordToCheck.description, recordToCheck.date, recordToCheck.time, recordToCheck.amount, recordToCheck.currency, originalCurrency, originalAmount, correction, note, {
                                            virtualpayeeId: virtualPayee.id,
                                            payeeId: payee.id
                                        }, recordToCheck.userId)
                                    })
                            })
                        }
                        else {
                            return FactoryORM.getORM("VirtualPayee").create({payee: recordToCheck.payee, description: recordToCheck.description,categoryId: null, subcategoryId: null, userId: recordToCheck.userId}).then(function(virtualPayee) {
                                return currentThis.insertOneRecord(null, null, isTransaction, status,recordToCheck.description, recordToCheck.date, recordToCheck.time, recordToCheck.amount,recordToCheck.currency,originalCurrency, originalAmount, correction, note,
                                    {
                                        virtualpayeeId: virtualPayee.id
                                    }, recordToCheck.userId)
                            })
                        }
                    } else {
                        return FactoryORM.getORM("VirtualPayee").create({payee: recordToCheck.payee, description: recordToCheck.description,categoryId: payee.categoryId, subcategoryId: payee.subcategoryId, userId: recordToCheck.userId}).then(function(virtualPayee) {
                            return currentThis.insertOneRecord(null, null, isTransaction, status,recordToCheck.description, recordToCheck.date, recordToCheck.time, recordToCheck.amount,recordToCheck.currency,originalCurrency, originalAmount, correction, note,
                             {
                                 payeeId: payee.id, 
                                 virtualpayeeId: virtualPayee.id
                            }, recordToCheck.userId)
                        })
                    }
                })
            }
        })
    }

    var findOneRecordByObject = function(recordToFindAsJsObject){
        var returnRecord = null;
        var recordToFindPayee = recordToFindAsJsObject.payee || ''; 
        var recordToFindDescription = recordToFindAsJsObject.description || '';
        return FactoryORM.getORM('Record').findAll({
            where: {
                date:recordToFindAsJsObject.date,
                userId: recordToFindAsJsObject.userId
            },
            include: [FactoryORM.getORM('VirtualPayee')]})
            .then(function(records){
                records.map(function(record){
                    var recordFromBasePayee = record.virtualpayee.payee || null;
                    var recordFromBaseDescription = record.virtualpayee.description || null;
                    if(recordToFindPayee.contains(recordFromBaseDescription) || (recordToFindPayee).contains(recordFromBasePayee) || (recordToFindDescription).contains(recordFromBasePayee)) {
                        returnRecord = record;
                    }
                })
                return Promise.resolve(returnRecord);
        })
    }
    var getOneRecordByIdWithCategoryAndSubcategory = function (id) {
        return FactoryORM.getORM('Record').findOne({where:{id:id}, include:[FactoryORM.getORM('Payee')]})
    }
    var editRecordById = function(id, newData) {
        return FactoryORM.getORM('Record').update({payeeId: newData.payeeId, virtualpayeeId: newData.virtualpayeeId}, {where: {id:id}})
    }
    var groupByCategoriesAndSubcategories = function (userId) {
        return FactoryORM.getORM('Record').findAll({
            order: [
                [{model: FactoryORM.getORM('VirtualPayee')},{model:FactoryORM.getORM('Category')}, 'name', 'ASC'],
                [{model: FactoryORM.getORM('VirtualPayee')},{model:FactoryORM.getORM('Subcategory')}, 'name', 'ASC']
            ],
            include: [{
                        model: FactoryORM.getORM('Payee'),
                        include: [{ model: FactoryORM.getORM('Category') }, { model: FactoryORM.getORM('Subcategory') }]
                }, {
                    model: FactoryORM.getORM('VirtualPayee'),
                    include: [{ model: FactoryORM.getORM('Category') }, { model: FactoryORM.getORM('Subcategory') }]
                }],
            where: {
                userId: userId
            },        
        })
    }
    return {
        getAllRecords : getAllRecords,
        insertOneRecord: insertOneRecord,
        deleteOneRecord:deleteOneRecord,
        updateOneRecord:updateOneRecord,
        nullPayeeId:nullPayeeId,
        updateById: updateById,
        getOneRecord: getOneRecord,
        insertRecordIfItDoesntExist: insertRecordIfItDoesntExist,
        findOneOrCreate: findOneOrCreate,
        editRecordById: editRecordById,
        getOneRecordByIdWithCategoryAndSubcategory:getOneRecordByIdWithCategoryAndSubcategory,
        getRecordInnerJoined: getRecordInnerJoined,
        findOneRecordAndUpdatePayeeNameIfNeeded: findOneRecordAndUpdatePayeeNameIfNeeded,
        findOneRecordIfDescContainsPayee: findOneRecordIfDescContainsPayee,
        groupByCategoriesAndSubcategories: groupByCategoriesAndSubcategories,
        findOneRecordByObject: findOneRecordByObject
    }
})();

module.exports = Record;
