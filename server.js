/**
 * Package: Pushy
 * Description: A simple push server for applications.
 * Author: Edwin Luijten
 * Version: 0.1	
 */

// Require modules
var http = require('http'),
	io = require('socket.io'),
	sys = require('sys'),
	express = require('express'),
	mysql = require('mysql');

// Require config
var	config = require('./config');

// Create app
var app = express();

app.configure(function () {
    app.use(express.cookieParser());
    app.use(express.session({secret: 'secret'}));
});

// Boot up
const pusher = io.listen(http.createServer(app).listen(config.app.port));

sys.log('Started server on http://localhost:' + config.app.port + '/');

// Create mysql connection
var mysqlConnection = mysql.createConnection({
	host: config.db.hostname,
	user: config.db.username,
	password: config.db.password,
	database: config.db.database,
});

mysqlConnection.connect();

// Holds client data
var clientData = null;

// Authorize
pusher.set('authorization', function(handshakeData, callback) {
	console.log(req.cookies.name);

	/**
	 * Based on app_key and domain we'll retrieve the channel to join,
	 * You may see a channel as an app namespace
	 */
	sql = 'SELECT channel FROM pusher WHERE `domain`="' + mysqlConnection.escape(handshakeData.headers.origin) + '" AND `app_key`="' + mysqlConnection.escape(handshakeData.query.app_key) +'" LIMIT 1';

	mysqlConnection.query(sql, function(err, row, fields) {
		if(err) throw err;

		if(row.length === 0)
		{
			callback(null, false);
		}

		// Add client data
		clientData = row[0];
			
		callback(null, true);
	});
	
	
});

/**
 * Listen for connection
 */
pusher.sockets.on('connection', function(client) {
	
	var connected = true;
		
	if(connected)
	{
		// Join room/channel
		client.join(clientData.channel);
		
		/**
		 * Send event
		 */
		client.on('send', function (data) {
			pusher.sockets.in(clientData.channel).emit('message', data);
		});	
	}
});
