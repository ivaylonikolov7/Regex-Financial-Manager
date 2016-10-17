function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}

// then to call it, plus stitch in '4' in the third group
function createGuid() {
    return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
}

function addRowToTable() {
    var dateTd = $('<td>');
    var inputDate = $('<input>', {class: 'date', type: 'date'});
    dateTd.append(inputDate);

    var timeTd = $('<td>');
    var inputTime = $('<input>', {class: 'time', type: 'time'});
    timeTd.append(inputTime);

    var amountTd = $('<td>');
    var inputAmount = $('<input>', {class: 'amount', type: 'text'})
    amountTd.append(inputAmount);

    var descriptionTd = $('<td>');
    var descriptionInput = $('<input>', {class: 'description', type: 'text'})
    descriptionTd.append(descriptionInput);

    var payeeTd = $('<td>');
    var inputPayee = $('<input>', {class: 'payee', type: 'text'});
    payeeTd.append(inputPayee);

    var categoryTd = $('<td>');
    var selectCategory = $('<select>', {class: 'categories'})
    $.get('get-categories',function(categories)
    {
        var result = [$('<option>', {text:'Select category', value:null})];
        var a=categories.map(function(category)
        {
            result.push($('<option>', {text: category.name, value:category.id}));
        });
        selectCategory.append(result);
    })
    categoryTd.append(selectCategory);

    var subcategoryTd = $('<td>');
    var subcategorySelect = $('<select>', {class: 'subcategories'});
    var optionTd = $('<option>', {text: 'Select subcategory', value:null})
    subcategorySelect.append(optionTd);
    subcategoryTd.append(subcategorySelect);

    var correctionTd = $('<td>')
    var correctionInput = $('<input>', {class: 'correction', type:'text'})
    correctionTd.append(correctionInput);

    var noteTd = $('<td>').append($('<input>', {class: 'note', type:'text'}));
    var expenseTd = $('<td>').append($('<input>', {class: 'expense', disabled: true}));
    var deleteTd = $('<td>').append($('<button>', {class: 'delete-record', text: 'Delete'}));
    var tr = $('<tr>', {class: 'records-to-add'});
    tr.append(dateTd);
    tr.append(timeTd);
    tr.append(amountTd);
    tr.append(descriptionTd);
    tr.append(payeeTd);
    tr.append(categoryTd);
    tr.append(subcategoryTd);
    tr.append(correctionTd);
    tr.append(noteTd);
    tr.append(expenseTd);
    tr.append(deleteTd);
    $('table').append(tr)
}

function addGuidToRow(rowThis) {
    if (rowThis.attr('guid') == null) {
        rowThis.attr('guid', createGuid())
    }
}

$(document).ready(function(){

    function extractDataFromRow(rowThis, selectThis) {
        var id = parseInt(rowThis.attr('id'));
        var dateInput = rowThis.find('.date').val();
        var timeInput = rowThis.find('.time').val();
        var amount = rowThis.find('.amount').val();
        var payeeName = rowThis.find('.payee').val();
        var correction = rowThis.find('.correction').val();
        var note = rowThis.find('.note').val();
        var categoryId = rowThis.find('.categories').val();
        var subcategoryId = rowThis.find('.subcategories').val();
        var description  = rowThis.find('.description').val();
        var thisClass = selectThis.attr('class');
        var thisValue = selectThis.val();

        if(categoryId=='Select category')
        {
            categoryId = null;
        }
        if(subcategoryId=='Select subcategory')
        {
            subcategoryId = null;
        }
        return {
            id: id,
            dateInput:dateInput,
            timeInput:timeInput,
            amount:amount,
            payeeName:payeeName,
            correction:correction,
            note: note,
            categoryId:categoryId,
            subcategoryId:subcategoryId,
            description: description,
            thisClass: thisClass,
            thisValue: thisValue
        }
    }
    var recordsToEdit = new ListRecords();
    var recordsToAdd = new ListRecords()

    $('table').on('change', '.added-records td .date,.added-records td .time', function () {
        var rowThis = $(this).parent().parent();
        var selectThis = $(this);
        var row = extractDataFromRow(rowThis, selectThis);
        var record = new Record(row.id,row.dateInput, row.timeInput, row.amount, row.payeeName, row.correction, row.note, row.categoryId, row.subcategoryId, row.description);

        if(recordsToEdit.checkIfUniqueRecord(row.id)) {
            recordsToEdit.addRecord(record);
        }
        else {
            recordsToEdit.editRecord(row.id, 'date', row.dateInput + ' ' + row.timeInput)
        }
    });

    $('table').on('change', '.records-to-add td .date,.records-to-add td .time', function () {
        var rowThis = $(this).parent().parent();
        var selectThis = $(this);
        var row = extractDataFromRow(rowThis, selectThis);
        addGuidToRow(rowThis);
        var guid = rowThis.attr('guid');
        var record = new Record(guid,row.dateInput, row.timeInput, row.amount, row.payeeName, row.correction, row.note, row.categoryId, row.subcategoryId, row.description);
        if(recordsToAdd.checkIfUniqueRecord(guid)){
            recordsToAdd.addRecord(record);
        }
        else {
            recordsToAdd.editRecord(guid, 'date', row.dateInput + ' ' + row.timeInput)
        }
    });


    $('table').on('keyup', '.added-records td input[type=text]', function()
    {
        var rowThis = $(this).parent().parent();
        var selectThis = $(this);
        var row = extractDataFromRow(rowThis, selectThis);
        var record = new Record(row.id,row.dateInput, row.timeInput, row.amount, row.payeeName, row.correction, row.note, row.categoryId, row.subcategoryId, row.description);

        var amountNumber = row.amount.match(/([0-9]+\.?([0-9]{2})?) ?([A-Z]{3})?/)

        var currentCorrection = rowThis.find('.correction').val();
        var expenseCorrection = null;
        var amountCorrection ;
        if(row.amount == '') {
            amountCorrection = 0
        }
        else {
            amountCorrection = parseFloat(amountNumber)
        }
        if(row.correction==null || currentCorrection=="") {
            expenseCorrection = 0;
        }
        else {
            expenseCorrection = parseFloat(row.correction)
        }

        var expense = amountCorrection + expenseCorrection;

        rowThis.find('.expense').val(expense.toFixed(2));

        if(recordsToEdit.checkIfUniqueRecord(row.id)) {
            recordsToEdit.addRecord(record);
        }
        else {
            recordsToEdit.editRecord(row.id, row.thisClass, row.thisValue)
        }
    });

    $('table').on('keyup', '.records-to-add td input[type=text]', function()
    {
        var rowThis = $(this).parent().parent();
        var selectThis = $(this);
        var row = extractDataFromRow(rowThis, selectThis);
        addGuidToRow(rowThis);
        var guid = rowThis.attr('guid');

        var amountNumber = row.amount.match(/([0-9]+\.[0-9]+) [A-Z]{3}/)



        var expenseCorrection;
        var amountCorrection;
        var currentCorrection = rowThis.find('.correction').val();

        if(row.correction==null || currentCorrection == '') {
            expenseCorrection = 0;
        }
        else {
            expenseCorrection = parseFloat(row.correction)
        }


        if(row.amount==null || row.amount == '') {
            amountCorrection = 0;
        }
        else {
            amountCorrection = parseFloat(row.amount)
        }

        rowThis.find('.expense').val(amountCorrection + expenseCorrection);

        var record = new Record(guid,row.dateInput, row.timeInput, row.amount, row.payeeName, row.correction, row.note, row.categoryId, row.subcategoryId, row.description);

        if(recordsToAdd.checkIfUniqueRecord(guid)) {
            recordsToAdd.addRecord(record);
        }
        else {
            recordsToAdd.editRecord(guid, row.thisClass, row.thisValue)
        }
        console.log(recordsToAdd)
    });


    $('table').on('change',  '.added-records td .categories', function()
    {
        var rowThis = $(this).parent().parent();
        var selectThis = $(this);
        var selectThisValue = $(this).val()
        if(selectThisValue==43 || selectThisValue==48 || selectThisValue==50 ) {
            rowThis.find('.subcategories').css('display', 'none')
        }
        else {
            rowThis.find('.subcategories').css('display', 'block')
        }
        var subcategoriesThis = rowThis.find('.subcategories');
        $.get({
            url: '/get-specific-subcategories',
            data:{id: $(this).val()},
            success: function(subcategories){
                addCategoriesToTable(subcategoriesThis,subcategories);
                var row = extractDataFromRow(rowThis, selectThis);
                var record = new Record(row.id,row.dateInput, row.timeInput, row.amount, row.payeeName, row.correction, row.note, row.categoryId, row.subcategoryId, row.description);
                if(recordsToEdit.checkIfUniqueRecord(row.id)) {
                    recordsToEdit.addRecord(record);
                }
                else {
                    recordsToEdit.editRecord(row.id, row.thisClass, row.thisValue)
                }
            }
        })
    });

    $('table').on('change',  '.records-to-add td .categories', function()
    {
        var rowThis = $(this).parent().parent();
        var selectThis = $(this);

        addGuidToRow(rowThis);
        var guid =rowThis.attr('guid');
        var selectThisValue = $(this).val()

        if(selectThisValue==43 || selectThisValue==48 || selectThisValue==50 ) {
            rowThis.find('.subcategories').css('display', 'none')
        }
        else {
            rowThis.find('.subcategories').css('display', 'block')
        }
        var subcategoriesThis = rowThis.find('.subcategories');
        $.get({
            url: '/get-specific-subcategories',
            data:{id: $(this).val()},
            success: function(subcategories){
                addCategoriesToTable(subcategoriesThis,subcategories);
                var row = extractDataFromRow(rowThis, selectThis);
                var record = new Record(guid,row.dateInput, row.timeInput, row.amount, row.payeeName, row.correction, row.note, row.categoryId, row.subcategoryId, row.description);

                if(recordsToAdd.checkIfUniqueRecord(guid)) {
                    recordsToAdd.addRecord(record);
                }
                else {
                    recordsToAdd.editRecord(guid, row.thisClass, row.thisValue)
                }
            }
        })
    });


    $('table').on('change',  '.added-records td .subcategories', function()
    {
        var rowThis = $(this).parent().parent();
        var selectThis = $(this);
        var row = extractDataFromRow(rowThis, selectThis);
        var record = new Record(row.id,row.dateInput, row.timeInput, row.amount, row.payeeName, row.correction, row.note, row.categoryId, row.subcategoryId, row.description);
        if(recordsToEdit.checkIfUniqueRecord(row.id)) {
            recordsToEdit.addRecord(record);
        }
        else {
            recordsToEdit.editRecord(row.id, row.thisClass, row.thisValue)
        }

    })

    $('table').on('change',  '.records-to-add td .subcategories', function()
    {
        var rowThis = $(this).parent().parent();
        var selectThis = $(this);
        var row = extractDataFromRow(rowThis, selectThis);
        addGuidToRow(rowThis);
        var guid = rowThis.attr('guid');

        var record = new Record(guid,row.dateInput, row.timeInput, row.amount, row.payeeName, row.correction, row.note, row.categoryId, row.subcategoryId, row.description);
        if(recordsToAdd.checkIfUniqueRecord(record.id)) {
            recordsToAdd.addRecord(record);
        }
        else {
            recordsToAdd.editRecord(record.id, row.thisClass, row.thisValue)
        }

    })


    $('#save-record').on('click', function()
    {
        var recordsJSON = JSON.stringify(recordsToEdit.returnListRecords())
        var recordsToCreate = JSON.stringify(recordsToAdd.returnListRecords());
        console.log(recordsJSON);
        $.ajax(
            {
                method: 'PUT',
                url: '/edit-records',
                data: {records: recordsJSON},
                success: function(){
                    recordsToEdit = new ListRecords();
                }
            }
        )
        $.ajax(
            {
                method: 'POST',
                url: '/post-records',
                data: {records: recordsToCreate},
                success: function(addedRecords){
                    for(i=0; i<recordsToAdd.records.length; i++)
                    {
                        var record = recordsToAdd.records[i];
                        $('tr[guid]').each(function()
                        {
                            $(this).removeAttr('guid')
                            $(this).attr('id', addedRecords[i])
                        })
                    }
                    recordsToCreate = new ListRecords();

                }
            }
        )
    })

    $('#add-record').on('click', function()
    {
        addRowToTable();
    })
})

function addCategoriesToTable(subcategoriesThis,subcategories) {
    $(subcategoriesThis).html('');
    subcategoriesThis.append($('<option>', {text: 'Select subcategory', value: null}))
    for(var i=0; i<subcategories.length; i++) {
        var option = $('<option>', {value: subcategories[i].id, text: subcategories[i].name})
        $(subcategoriesThis).append(option);
    }
}