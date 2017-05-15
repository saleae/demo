let express = require('express');
let app = express();

//Static Files
app.use(express.static('public'));
app.get('/', function (req, res) { 
    res.sendFile(`${__dirname}/public/index.html`); 
});

app.listen(3000);