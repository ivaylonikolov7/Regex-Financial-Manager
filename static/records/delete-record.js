$('.delete-record').on('click', function(){
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
