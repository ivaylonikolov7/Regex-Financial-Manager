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
            subcategoryId: payee.subcategoryId
        })
    }

    var deletePayee = function(payeeId){
        return FactoryORM.getORM('VirtualPayee').destroy({where: {id:payeeId}})
    }
    return {syncPayees: syncPayees, insertPayee: insertPayee, deletePayee: deletePayee}
})();


module.exports = VirtualPayees;

