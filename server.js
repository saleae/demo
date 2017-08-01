// Get dependencies
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
// var mongo = require('mongodb').MongoClient;
// var mysql = require('mysql');

// Get our API routes
const api = require('./server/routes/api');

const app = express();

// Parsers for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Point static path to dist
app.use(express.static(path.join(__dirname, 'dist')));

// Set our api routes
app.use('/api', api);

// Catch all other routes and return the index file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

/*
var mongo_url = 'mongodb://u9nk7zFl225V:GzfZkYr5tDfa@ds153392.mlab.com:53392/saleae_sandbox';
mongo.connect(mongo_url, function(err, db) {
  if(!err){
    console.log("Connected successfully to mongo database");
    db.close();
  }
});
*/
/*
// hosted SQL not currently availible. To use MySQL, run locally and place your connection information here
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
*/



/**
 * Get port from environment and store in Express.
 */
const port = process.env.PORT || '3001';
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, () => console.log(`API running on localhost:${port}`));