var socket  = io.connect('http://localhost:3000');

function addRowToTable(exampleString, card,amount, date) {
    var unixDate = Date.parse(date);
    var newDate = new Date(unixDate);
    console.log(newDate);
    var month = parseInt(newDate.getMonth())+1;
    var formatedDate = newDate.getDate() + "." + month + "." + newDate.getFullYear() + ' ' + newDate.getHours() + ':' + newDate.getMinutes();
    $('tr:last').after("<tr><td>" +exampleString +"</td><td>"+card+"</td><td>"+amount+"</td><td>"+formatedDate+"</td></tr>");
}
socket.on('add-new-record', function(data)
{
    addRowToTable(data.example, data.card, data.amount,data.date);
})