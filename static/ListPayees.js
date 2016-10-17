function ListPayees()
{
    this.payees = []
}
ListPayees.prototype.addPayee = function(payee)
{
    this.payees.push(payee);
}

ListPayees.prototype.checkIfUniquePayee = function(payee)
{
    var returnSth = true;
    for(var i=0; i<this.payees.length; i++)
    {
        if(this.payees[i].id==payee.id)
        {
            returnSth = false;
        }
    }
    return returnSth;
}
ListPayees.prototype.editPayee = function(payeeId, field, data)
{
    var payee = find(this.payees, payeeId);
    if(field=='payee')
    {
        payee.name = data;
    }
    if(field=='description')
    {
        payee.description = data;
    }
    if(field=='categories')
    {
        payee.setSubcategoryId(null);
        payee.setCategoryId(data);
    }
    if(field=='subcategories')
    {
        payee.setSubcategoryId(data);
    }
    this.editPayees(payeeId, payee)
}

ListPayees.prototype.editPayees = function(payeeId, payee)
{
    var payees = this.payees;
    for(var i=0; i<payees.length; i++)
    {
        if(payees[i].id == payeeId)
        {
            payees[i] = payee;

        }
    }
    this.payees = payees;
}

ListPayees.prototype.getPayeesObject = function()
{
    var payeesAJAXModel = []
    for(var i=0; i<this.payees.length; i++)
    {
        payeesAJAXModel.push(
        {
            id: this.payees[i].id,
            payee: this.payees[i].name,
            description: this.payees[i].description,
            category: this.payees[i].getCategoryId(),
            subcategory: this.payees[i].getSubcategoryId()
        })
    }
    return payeesAJAXModel;
}

ListPayees.prototype.findPayee = function(id)
{
    var payee;

    for(var i=0; i<this.payees.length; i++)
    {
        if(this.payees[i].id==id)
        {
            payee = this.payees[i];
        }
    }

    return payee;
};

ListPayees.prototype.removePayee = function(id)
{
    _.without()
}

find = function(payees, id)
{
    for(var i=0; i<payees.length; i++)
    {
        if(payees[i].id==id)
        {
            return payees[i];
        }
    }
}
