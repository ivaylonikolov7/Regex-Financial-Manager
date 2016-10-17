function ListRecords() {
    this.records = [];
}

ListRecords.prototype.addRecord = function(record) {
    this.records.push(record);
}

ListRecords.prototype.editRecord = function (id, field, data) {
    for(var i=0; i<this.records.length; i++)
    {
        if(this.records[i].id == id)
        {
            switch(field)
            {
                case 'date': this.records[i].date = data; break;
                case 'time': this.records[i].date = data; break;
                case 'amount': this.records[i].amount = data; break;
                case 'correction': this.records[i].correction = data; break;
                case 'note': this.records[i].note = data; break;
                case 'categories': this.records[i].categoryId = data; break;
                case 'subcategories': this.records[i].subcategoryId = data; break;
                case 'payee': this.records[i].payee = data; break;
                case 'description': this.records[i].description = data; break;
            }
        }
    }
}

ListRecords.prototype.checkIfUniqueRecord = function(id)
{
    var checkIfUnique = true;
    for(var i=0; i<this.records.length; i++) {
        if (this.records[i].id == id) {
            checkIfUnique = false;
        }
    }
    return checkIfUnique;
}

ListRecords.prototype.returnListRecords = function()
{
    var outputRecords= []
    for(var i=0; i<this.records.length; i++) {
        var record = this.records[i];
        outputRecords.push({
            id:record.id,
            date: record.date,
            amount: record.amount,
            description: record.description,
            payee: record.payee,
            category: record.categoryId,
            subcategory: record.subcategoryId,
            correction: record.correction,
            note: record.note
        })
    }
    return outputRecords;
}