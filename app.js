let express = require('express');
let app = express();
var mongo = require('mongodb').MongoClient;
var mysql = require('mysql');
var bodyParser = require('body-parser')

// parse application/json 
app.use(bodyParser.json());

//Static Files
app.use(express.static('public'));

app.get('/', function (req, res) { 
    res.status(200).send('The index page is not accessable due to the proxy rules in package.json');
});

app.get('/api/test', function(req, res){
  res.status(200).send('hello from the server');
});

var mongo_url = 'mongodb://u9nk7zFl225V:GzfZkYr5tDfa@ds153392.mlab.com:53392/saleae_sandbox';
mongo.connect(mongo_url, function(err, db) {
  if(!err){
    console.log("Connected successfully to mongo database");
    db.close();
  }
});

// hosted SQL not currently availible. To use MySQL, run locally and place your connection information here
var connection = mysql.createConnection({
  host     : 'sql3.freemysqlhosting.net',
  user     : 'sql3184678',
  password : '8KvEnV3c93',
  database : 'sql3184678'
});
/*
connection.connect(function(err) {
  if (!err) {
    console.log('connected as id ' + connection.threadId);
  }else
  {
      console.error('error connecting: ' + err.stack);
  }
});
*/
console.log('listening on port 3001');
app.listen(3001);
