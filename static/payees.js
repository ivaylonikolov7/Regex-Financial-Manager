function addAddedPayeeToTable(payeesJSON, data) {
    for (var i = 0; i < payeesJSON.length; i++) {

        var tr = $('<tr>', {id: payeesJSON[i].id, class: 'added-payee'});
        var tdPayee = $('<td>');
        var payeeInput = $('<input>', {type: 'text', value: payeesJSON[i].payee, class: 'payee'});
        var tdDescription = $('<td>');
        var descriptionInput = $('<input>', {type: 'text', value: payeesJSON[i].description, class: 'description'});
        var tdCategory = $('<td>');
        var categories = ($('<select>', {class: 'categories'}))
        var option = $('<option>', {text: 'Select category'});
        categories.append(option);
        for (var j = 0; j < data.categories.length; j++) {
            if (data.categories[j].id == payeesJSON[i].categoryId) {
                var optionElement = $('<option>', {
                    text: data.categories[j].name,
                    value: data.categories[j].id,
                    selected: true
                });
                categories.append(optionElement);
            }
            else {
                var optionElement = $('<option>', {text: data.categories[j].name, value: data.categories[j].id});
                categories.append(optionElement);
            }
        }

        var tdSubcategory = $('<td>');
        var selectSubcategories = $('<option>', {text: 'Select subcategory'});
        var subcategories = ($('<select>', {class: 'subcategories'}));
        subcategories.append(selectSubcategories);
        for (var j = 0; j < data.subcategories.length; j++) {
            if (data.subcategories[j].categoryId == payeesJSON[i].categoryId)
            {
                if(data.subcategories[j].id == payeesJSON[i].subcategoryId) {
                    var optionElement = $('<option>', {
                        text: data.subcategories[j].name,
                        id: data.subcategories[j].id,
                        selected: true
                    });
                    subcategories.append(optionElement);
                }
                else {
                    var optionElement = $('<option>', {
                        text: data.subcategories[j].name,
                        id: data.subcategories[j].id,
                    });
                    subcategories.append(optionElement);
                }
            }
        }
        var categorySelectedId = categories.find(':selected').val()
        if(categorySelectedId==43 || categorySelectedId== 48 || categorySelectedId==50)
        {
            subcategories.css('display', 'none');
        }
        var deleteButton = $('<button>', {class: 'delete-payee', text: 'Delete'});
        var tdDeleteButton = $('<td>');

        tdDeleteButton.append(deleteButton);
        tdSubcategory.append(subcategories);
        tdCategory.append(categories);
        tdPayee.append(payeeInput);
        tdDescription.append(descriptionInput);
        tr.append(tdPayee);
        tr.append(tdDescription);
        tr.append(tdCategory);
        tr.append(tdSubcategory);
        tr.append(tdDeleteButton);
        $('tr:last').after(tr);

    }
    return {categories: categories, subcategories: subcategories};
}
function addNewCleanRowToTable(categories) {
    var tr = $('<tr>', {class: 'add-payee',});
    var payeeNameTd = $('<td>');
    var inputPayeeName = $('<input>', {type: 'text', name: 'payee', class: 'payee'})
    var descriptionTd = $('<td>');
    var inputDescription = $('<input>', {type: 'text', name: 'description', class: 'description'})
    var categoryTd = $('<td>');
    var categorySelect = $('<select>', {class: 'categories', name: 'categories'})
    var optionCategorySelect = $('<option>', {value: null, text: 'Select category'});
    var subcategoryTd = $('<td>');
    var subcategorySelect = $('<select>', {class: 'subcategories', name: 'subcategories'})
    var optionSubcategorySelect = $('<option>', {value: null, text: 'Select subcategory'});
    var deleteButton = $('<button>', {text: 'Delete'});
    var deleteTd = $('<td>');
    deleteTd.append(deleteButton)
    categorySelect.append(optionCategorySelect)
    subcategorySelect.append(optionSubcategorySelect);
    payeeNameTd.append(inputPayeeName);
    descriptionTd.append(inputDescription);
    for (var i = 0; i < categories.length; i++) {
        var category = categories[i];
        var newOption = $('<option>', {value: category.id, text: category.name})
        categorySelect.append(newOption)
    }
    categoryTd.append(categorySelect);
    subcategoryTd.append(subcategorySelect);

    tr.append(payeeNameTd);
    tr.append(descriptionTd);
    tr.append(categoryTd);
    tr.append(subcategoryTd);
    tr.append(deleteTd)
    $('table').append(tr);
}

$(document).ready(function() {
    var originalAddedPayees = new ListPayees();
    var payeesToEdit = new ListPayees();
    var payeesToAdd = new ListPayees();
    var payeesInput = $('table .added-payee td').find('.payee');
    var payeeToAdd;

    for(var i=0; i<payeesInput.length; i++)
    {
        var name = $(payeesInput[i]).val();
        var id = $(payeesInput[i]).parent().parent().attr('id');
        var description = $($(payeesInput[i]).parent().parent().find('.description')).val();
        var categoryId = $($(payeesInput[i]).parent().parent().find('.categories')).val();
        var subcategoryId = $(payeesInput[i]).parent().parent().find('.subcategories').val();
        var payee = new Payee(id, name, description, categoryId, subcategoryId);
        originalAddedPayees.addPayee(payee);
    }
    var clonedAddPayeeRow = $('.add-payee').clone();

    $('.added-payee .subcategories').on('change', function() {
        var selectedThis = $(this);
        var parentThisRow = selectedThis.parent().parent();
        var payeeId = $(selectedThis).parent().parent().attr('id');
        var payee = $(parentThisRow.find('td')[0]).html();
        var description = $(parentThisRow.find('td')[1]).html();
        var categoryId = $(parentThisRow.find('td select')[0]).val();
        var subcategoryId = $(parentThisRow.find('td select')[1]).val();
    });

    function addRow(data) {
        var tr = $('<tr>', {id: data.id});
        var td = $('<td>');
        var input = $('<input>', {type: 'text', value: data.name});
        var td2 = $('<td>');
        var input2 = $('<input>', {type: 'text', value: data.description});
        td.append(input);
        td2.append(input2)
        tr.append(td);
        tr.append(td2);
        $('tr:last').before(tr);
    }

    $('#save-payee').click(function() {
        console.log('for edit')
        console.log(payeesToEdit);
        console.log('for add:')
        console.log(payeesToAdd);

        $.ajax({
            type:'PUT',
            url: '/edit-payee',
            data: {payees: JSON.stringify(payeesToEdit.getPayeesObject())},
            success: function(){
                console.log(payeesToEdit);
            }
        });
        $.ajax({
            type: 'POST',
            url: '/post-payees',
            data: {payees: JSON.stringify(payeesToAdd.getPayeesObject())},
            success: function(data) {
                var payeesJSON = JSON.parse(data.payees);
                var categories = data.categories;
                payeesToAdd = new ListPayees();
                $('.add-payee').remove();

                addAddedPayeeToTable(payeesJSON, data);
                addNewCleanRowToTable(categories);
            }
        })
    });

    $('table').on('change', 'tr td .categories', function() {
        var selectThis = $(this);
        var selectedOption = selectThis.find('option:selected').html().trim();
        var tr = $(selectThis.parent().parent());
        var payee = tr.find('.payee').val()
        var description = tr.find('.description').val();
        var categoryId = selectThis.parent().parent().find('.categories').val();
        var subcategoryId = selectThis.parent().parent().find('.subcategories').val();

        if(selectThis.val()=="43" || selectThis.val()=="48" || selectThis.val()=="50")
        {
            $(selectThis.parent().parent().find('.subcategories')).css('display', 'none');
        }
        else
        {
            $(selectThis.parent().parent().find('.subcategories')).css('display', 'block');
        }

        if(tr.hasClass('added-payee'))
        {
            var id = tr.attr('id');
            var payeeForEdit = new Payee(id,payee, description, categoryId,subcategoryId);
            if(payeesToEdit.checkIfUniquePayee(payeeForEdit)){
                payeesToEdit.addPayee(payeeForEdit);
                payeesToEdit.editPayee(id, 'subcategories', null)
            }
            else {
                payeesToEdit.editPayee(id, 'categories', categoryId)
            }
        }
        if(tr.hasClass('add-payee'))
        {
            var id = tr.attr('guid');
            var payeeForAdd = new Payee(id,payee, description, categoryId,subcategoryId);
            if(payeesToAdd.checkIfUniquePayee(payeeForAdd)){
                payeesToAdd.addPayee(payeeForAdd);
                console.log('add');
                console.log(payeesToAdd)
            }
            else {
                payeesToAdd.editPayee(id, 'categories', categoryId);
                console.log(payeesToAdd)
            }
        }
        $.get(
            {
                url: "/get-all-payees",
                data:{selectedOption:selectedOption},
                success:function(data) {
                    var subcategories = data.newSubcategories;
                    var tableRow =    $(selectThis).parent().parent();
                    tableRow.find('.subcategories option').remove();
                    tableRow.find('td .subcategories').append('<option>Select subcategory</option>');

                    for(var i=0; i<subcategories.length; i++)
                    {
                        tableRow.find('td .subcategories').append($('<option>', {
                            text: subcategories[i].name,
                            value: subcategories[i].id
                        }))
                    }
                }
            })
    });

    $('table').on('change', 'td .subcategories', function()
    {
        var selectThis = $(this);
        var selectedOption = selectThis.find('option:selected').html().trim();
        var tr = $(selectThis.parent().parent());
        var payee = tr.find('.payee').val()
        var description = tr.find('.description').val();
        var categoryId = selectThis.parent().parent().find('.categories').val();
        var subcategoryId = selectThis.parent().parent().find('.subcategories').val();

        if(tr.hasClass('added-payee'))
        {
            var id = tr.attr('id');
            var singlePayee = new Payee(id,payee, description, categoryId, subcategoryId);
            if(payeesToEdit.checkIfUniquePayee(singlePayee)) {
                payeesToEdit.addPayee(singlePayee)
            }
            else{
                payeesToEdit.editPayee(id, 'subcategories', subcategoryId)
            }

            console.log(payeesToEdit);
        }

        if(tr.hasClass('add-payee'))
        {
            var id = tr.attr('guid');
            var selectedId = $(this).children(':selected').attr('value');
            payeesToAdd.editPayee(id, 'subcategories', selectedId)
            console.log(payeesToAdd);
        }
    });

    $('body').on('click', '#add-payee', ( function() {
        $('table').append('<tr class="add-payee">' + clonedAddPayeeRow.html() + '</tr>');
    }));

    $('table').on('click', 'tr td .delete-payee', (function() {
        var selectedThis = $(this)
        var id = $(this).parent().parent().attr('id');
        $.ajax({
                url: '/delete-payee',
                data: {id: id},
                type: 'DELETE',
                success: function(){
                    selectedThis.parent().parent().remove();
                }
            }
        )
    }));

    $('table').on('keyup', '.added-payee td input', function()
    {
        var inputThis = $(this);
        var editedInput = $(this).val();
        var id = inputThis.parent().parent().attr('id');
        var name = inputThis.parent().parent().find('.payee').val();
        var description = inputThis.parent().parent().find('.description').val();
        var categoryId = inputThis.parent().parent().find('.categories').val();
        var subcategoryId = inputThis.parent().parent().find('.subcategories').val();
        var payee = new Payee(id, name, description, categoryId, subcategoryId);
        var attr = inputThis.attr('class');

        if(payeesToEdit.checkIfUniquePayee(payee))
        {
            payeesToEdit.addPayee(payee)
        }
        else
        {
            payeesToEdit.editPayee(id, attr, editedInput);
        }

    })
    $('table').on('keyup', '.add-payee td input', function()
    {
        var inputThis = $(this);
        var inputThisValue = inputThis.val();
        var name = inputThis.parent().parent().find('.payee').val();
        var description = inputThis.parent().parent().find('.description').val();
        var categoryId = inputThis.parent().parent().find('.categories').val();
        var subcategoryId = inputThis.parent().parent().find('.subcategories').val();
        var currentTd = inputThis.parent().parent();
        var inputName = inputThis.attr('class');
        if (currentTd.attr('guid')) {
            var id = inputThis.parent().parent().attr('guid');
            payeesToAdd.editPayee(id, inputName, inputThisValue);
        } else {
            inputThis.parent().parent().attr('guid', guidFunction());
            var guid = inputThis.parent().parent().attr('guid');
            payeeToAdd = new Payee(guid, name, description, categoryId, subcategoryId);
            payeesToAdd.addPayee(payeeToAdd);
        }
    });

    function guidFunction()
    {
        var guidString = (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase()
        return guidString;
    }

    function S4() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    }

});

