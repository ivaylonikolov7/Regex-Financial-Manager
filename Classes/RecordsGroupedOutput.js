function RecordsGroupedOutput() {
    this.totalAmount = {};
    this.totalAmount.allMonths = 0;
    this.months = {}
    this.totalAmount.byMonths = {};
    this.categoriesWithSubcategories = [];

}

RecordsGroupedOutput.prototype.addRecord = function (record) {
    function hasThisCategory(category) {
        var categoryNumber;
        var hasThisCategory = false;
        for (var i = 0; i < this.categoriesWithSubcategories.length; i++) {
            if (this.categoriesWithSubcategories[i].category == category) {
                categoryNumber = i;
                hasThisCategory = true;
            }
        }
        return {categoryNumber: categoryNumber, hasThisCategory: hasThisCategory};
    }
    function hasThisSubcategory(currentCategory, subcategory) {
        var hasThisSubcategory = false;
        for (var i = 0; i < currentCategory.subcategories.length; i++) {
            if (currentCategory.subcategories[i].name == subcategory) {
                hasThisSubcategory = true;
                subcategoryNumber = i;
            }
        }
        return {hasThisSubcategory: hasThisSubcategory, subcategoryNumber: subcategoryNumber};
    }


    var amount = parseFloat(record.amount);
    var month = record.date.getMonth()+1;

    if(this.months.hasOwnProperty(month)==false){
        this.months[month] = null
    };
    this.totalAmount.allMonths += parseFloat(amount);

    if(this.totalAmount.byMonths[month]==null) {
        this.totalAmount.byMonths[month] = amount;
    }
    else {
        this.totalAmount.byMonths[month] += amount;
    }

    var category = (record.virtualpayee.category!=null) ? record.virtualpayee.category.name : null;
    var subcategory = (record.virtualpayee.subcategory!=null)  ? record.virtualpayee.subcategory.name : null

    if(subcategory==null && category !=null){
        subcategory = 'No subcategory';
    }
    if(subcategory==null && category==null)
    {
        category='No category';
        subcategory = 'No subcategory';
    }

    var resultOfHasThisCategory = hasThisCategory.call(this, category);
    var categoryNumber = resultOfHasThisCategory.categoryNumber;
    var hasThisCategoryBoolean = resultOfHasThisCategory.hasThisCategory;

    if(hasThisCategoryBoolean){
        var currentCategory = this.categoriesWithSubcategories[categoryNumber];
        var hasThisSubcategoryResult = hasThisSubcategory(currentCategory, subcategory);
        var hasThisSubcategoryBoolean = hasThisSubcategoryResult.hasThisSubcategory;
        var subcategoryNumber = hasThisSubcategoryResult.subcategoryNumber;

        if(hasThisSubcategoryBoolean==true){
            this.addAmount(month,amount,categoryNumber, subcategoryNumber)
        }
        else{
            var tempMonth = {}
            tempMonth[month] = amount;
            this.categoriesWithSubcategories[categoryNumber].amountByCategory.monthsInCategory[month]+=amount;
            this.categoriesWithSubcategories[categoryNumber].subcategories.push({
                name:subcategory,
                amount: {
                    months: tempMonth,
                    totalAmount: amount
                }
            })
        }
    }
    else {
        var newTempMonth = JSON.parse(JSON.stringify(this.months));
        var newTempMonth2 = JSON.parse(JSON.stringify(this.months));    
    
        newTempMonth[month] = amount;
        newTempMonth2[month] = amount;

        this.categoriesWithSubcategories.push({
            category:category,
            amountByCategory:{total: amount, monthsInCategory:newTempMonth},
            subcategories: [{name: subcategory, amount: {months: newTempMonth2, totalAmount: amount}}],
        });
    }
}


RecordsGroupedOutput.prototype.addAmount =  function(newMonthInt, newFloatAmount, categoryNumber, subcategoryNumber){
    var newMonth = this.categoriesWithSubcategories[categoryNumber].subcategories[subcategoryNumber].amount.months[newMonthInt]
    if(newMonth==null) {
        this.categoriesWithSubcategories[categoryNumber].subcategories[subcategoryNumber].amount.months[newMonthInt] = newFloatAmount;
    }
    else {
        this.categoriesWithSubcategories[categoryNumber].subcategories[subcategoryNumber].amount.months[newMonthInt] += newFloatAmount;
    }

    this.categoriesWithSubcategories[categoryNumber].subcategories[subcategoryNumber].amount.totalAmount += newFloatAmount;
    var monthsInCategory = this.categoriesWithSubcategories[categoryNumber].amountByCategory.monthsInCategory;
    if(!(newMonthInt in monthsInCategory)){
        this.categoriesWithSubcategories[categoryNumber].amountByCategory.monthsInCategory[newMonthInt] = 0;
    }
    this.categoriesWithSubcategories[categoryNumber].amountByCategory.monthsInCategory[newMonthInt] += newFloatAmount;
    this.categoriesWithSubcategories[categoryNumber].amountByCategory.total += newFloatAmount;
}


module.exports = RecordsGroupedOutput