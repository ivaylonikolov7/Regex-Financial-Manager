var FactoryORM = require('../Classes/FactoryORM');

var Regex = (function () {

    var syncRegex = function () {
        return FactoryORM.getORM("Regex").sync();
    };
    var insertRegex = function(regex, amountOrder, payeeOrder, descriptionOrder, cardOrder,dayOrder, monthOrder, yearOrder, hourOrder, minuteOrder){
        return FactoryORM.getORM("Regex").create(
        {
            regex: regex,
            amountOrder: amountOrder,
            dayOrder: dayOrder,
            monthOrder: monthOrder,
            yearOrder: yearOrder,
            hourOrder:hourOrder,
            minuteOrder: minuteOrder,
            payeeOrder: payeeOrder,
            descriptionOrder:descriptionOrder,
            cardOrder: cardOrder
        })
    }
    
    var getAllRegexes = function () {
        return FactoryORM.getORM('Regex').findAll();
    }
    return {syncRegex: syncRegex, insertRegex: insertRegex, getAllRegexes: getAllRegexes}
})();


module.exports = Regex;
