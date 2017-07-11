let express = require('express');
let app = express();
var mongo = require('mongodb').MongoClient;
var mysql = require('mysql');

//Static Files
app.use(express.static('public'));
app.get('/', function (req, res) { 
    res.sendFile(`${__dirname}/public/index.html`); 
});

var mongo_url = 'mongodb://u9nk7zFl225V:GzfZkYr5tDfa@ds153392.mlab.com:53392/saleae_sandbox';
mongo.connect(mongo_url, function(err, db) {
  if(!err){
    console.log("Connected successfully to server");
    db.close();
  }
});

var connection = mysql.createConnection({
  host     : 'sql3.freemysqlhosting.net',
  user     : 'sql3184678',
  password : '8KvEnV3c93',
  database : 'sql3184678'
});

connection.connect(function(err) {
  if (!err) {
    console.log('connected as id ' + connection.threadId);
  }else
  {
      console.error('error connecting: ' + err.stack);
  }
});

app.listen(3000);

