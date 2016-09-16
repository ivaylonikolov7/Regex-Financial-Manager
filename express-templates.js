app.engine('handlebars', exphbs({defaultLayout:'main'}));
app.set('view engine', 'handlebars');
app.get('/', function(req, res)
{
    res.render('home');
});

app.listen(3000, function()
{
    console.log('app listening on port 3000');
});
