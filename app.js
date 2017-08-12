let express = require('express');
let app = express();
var mongo = require('mongodb').MongoClient;
var mysql = require('mysql');
var bodyParser = require('body-parser')
const assert = require('http-assert')
let db
let collection
const possibleReasons = ['purchase', 'other']

// parse application/json
app.use(bodyParser.json());

//Static Files
app.use(express.static('public'));

app.post('/api/user/visit-dialog', function(req, res){
  if (!db) return res.status(500).send({ message: 'Database is not yet connected. Please try again later.' })
  const { reason } = req.body
  console.log(req.body)
  if (!possibleReasons.includes(reason)) return res.status(400).send({ message: 'That\'s not a valid reason!' })
  collection.insertOne({
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    timestamp: new Date(),
    reason: reason
  }, function (err, result) {
    if (err) return res.status(500, { message: err.message })
    res.status(200).send({ successful: true });
  })
})

var mongo_url = 'mongodb://localhost:27017';
mongo.connect(mongo_url, function(err, dbInstance) {
  if(err) {
    console.error('connection failed', err)
    return
  }
  console.log("Connected successfully to mongo database");
  db = dbInstance
  collection = db.collection('userVisitingReasons')
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
