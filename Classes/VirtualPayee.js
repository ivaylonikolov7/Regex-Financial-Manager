var FactoryORM = require('../Classes/FactoryORM');

var VirtualPayees = (function () {
    var syncPayees = function () {
        return FactoryORM.getORM("VirtualPayee").sync()
    };
    var insertPayee = function (payee) {
        return FactoryORM.getORM("VirtualPayee").create({
            payee: payee.payee,
            description: payee.description,
            categoryId: payee.categoryId,
            subcategoryId: payee.subcategoryId,
            userId: payee.userId
        })
    }

    var deletePayee = function(payeeId){
        return FactoryORM.getORM('VirtualPayee').destroy({where: {id:payeeId}})
    }
    var editPayeeById = function (virtualPayeeId, payeeToEdit,recordToEdit, userId) {
        var vpThis = this;
        try {
            if(!recordToEdit.description){
                recordToEdit.description = null;
            }
        } catch (error) {
            console.log(error)
        }
        
        return FactoryORM.getORM('VirtualPayee').findOne({where: {id: virtualPayeeId}}).then(function (virtualPayee) {
            return vpThis.editPayeeByIdAndSearchForPayee(payeeToEdit.payee, recordToEdit.description, userId).then(function (foundPayee) {
                if (foundPayee != null) {
                    var categoryId=null;
                    var subcategoryId=null;
                    if (recordToEdit.categoryId == null) {
                        categoryId = foundPayee.categoryId;
                        subcategoryId = foundPayee.subcategoryId;
                    } else {
                        categoryId = recordToEdit.categoryId;
                        subcategoryId = recordToEdit.subcategoryId;
                    }

                    return FactoryORM.getORM('VirtualPayee').update(
                        {
                            payee: payeeToEdit.payee,
                            categoryId: categoryId,
                            subcategoryId: subcategoryId,
                            description: foundPayee.description
                        }, {where: {id: virtualPayeeId}})
                    .then(function () {
                        return FactoryORM.getORM('Record').update({payeeId: foundPayee.id},{where:{id:recordToEdit.id}})
                    })
                }
                else {
                    return FactoryORM.getORM('VirtualPayee').update({
                            payee: payeeToEdit.payee,
                            categoryId: payeeToEdit.categoryId,
                            subcategoryId: payeeToEdit.subcategoryId
                    }, {
                        where: {id: virtualPayeeId}}).then(function () {
                        return FactoryORM.getORM('Record').update({payeeId: null}, {where:{id:recordToEdit.id}})
                    })
                }
            })
        })
    }

    var searchForPayeesWithUserId = function(originalPayee,originalDescription, userId) {
        return FactoryORM.getORM("VirtualPayee").findAll({where:{userId: userId}})
        .then(function(payees){
            var returnPayee = null;
            payees.map(function(payee){
                if((originalPayee || "").contains(payee.payee ) || (originalPayee || "").contains(payee.description ) || (originalDescription || '').contains(payee.payee) || (originalDescription || '').contains(payee.description)){
                    returnPayee = payee;
                }
            })
            return Promise.resolve(returnPayee);
        })
    }

    var editPayeeByIdAndSearchForPayee = function(originalPayee,originalDescription, userId) {
        return FactoryORM.getORM("Payee").findAll({
            where:{
                userId: userId
            }
        }).then(function(payees){
            var returnPayee = null;
            payees.map(function(payee){
                if(
                    (originalPayee || "").contains(payee.payee ) || (originalPayee|| "").contains(payee.description ) || (originalDescription || '').contains(payee.payee) || (originalDescription || '').contains(payee.description)){
                    returnPayee = payee;
                }
            })
            return Promise.resolve(returnPayee);
        })
    }

    var editOnlyPayeeById = function(id, obj){
        FactoryORM.getORM('VirtualPayee').edi
    }
    var getOneVirtualPayee = function(editObj, id){
        return FactoryORM.getORM('VirtualPayee').findOne();
    }
    var editVirtualPayeeById = function (editObj, id) {
        FactoryORM.getORM('VirtualPayee').update(editObj, {where: {id: id}})
    }
    return { syncPayees: syncPayees,
            insertPayee: insertPayee,
            deletePayee: deletePayee,
            editPayeeById:editPayeeById,
            editPayeeByIdAndSearchForPayee:editPayeeByIdAndSearchForPayee,
            getOneVirtualPayee:getOneVirtualPayee,
            editVirtualPayeeById: editVirtualPayeeById,
            searchForPayeesWithUserId: searchForPayeesWithUserId,
    }
})();


module.exports = VirtualPayees;

