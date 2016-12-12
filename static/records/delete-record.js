$('.delete-record').on('click', function(){
    $(this).attr('disabled', true);
    var parentRow = $(this).parent().parent();
    var parentRowId = parentRow.attr('id');
    $.post({
        url: '/delete-record',
        method: 'DELETE',
        data: {id: parentRowId},
        success: function()
        {
            parentRow.remove();
        }
    })
})
