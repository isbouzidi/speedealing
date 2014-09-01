"use strict";

var passportSocketIo = require("passport.socketio"),
		express = require('express'),
		mongoose = require('mongoose'),
		mongoStore = require('connect-mongo')(express),
		config = require('./config');

var UserModel = mongoose.model('user');

module.exports = exports = function(server, db, socketsUser) {
	/** WebSocket */
	//console.log(db.connection.db);
	var sockets = require('socket.io').listen(server, {log: false});

	/*setTimeout(function() {
		sockets.set('authorization', passportSocketIo.authorize({
			cookieParser: express.cookieParser,
			key: 'SpeedSession', // the name of the cookie where express/connect stores its session_id
			secret: config.app.secret, // the session_secret to parse the cookie
			store: new mongoStore({
				db: db.connection.db,
				collection: 'session'
			}),
			//cookie: {
			//	maxAge: 36000000
			//expires: new Date(Date.now() + 3600000) //1 Hour
			//},
			success: function(data, accept) {
				//console.log('successful connection to socket.io');
				//console.log(data);
				console.log(data.user.name + " : Connected");

				// The accept-callback still allows us to decide whether to
				// accept the connection or not.
				accept(null, true);
			},
			fail: function(data, message, error, accept) {
				if (error)
					throw new Error(message);
				console.log('failed connection to socket.io:', message);

				// We use this callback to log all of our failed connections.
				accept(null, false);
			}
		}))
	}, 300);*/


	sockets.on('connection', function(socket) { // New client
		//console.log("connection");
		// User sends his username
		var socket_username = null;
		socket.on('user', function(username) {
			socket_username = username;
			socketsUser[username] = socket;
			//console.log(username + " : Connected");
			//console.log(socket);

			UserModel.findOne({_id: username}, "firstname lastname", function(err, user) {
				socket.broadcast.emit('notify', {
					title: '<strong>' + user.firstname + " " + user.lastname[0] + '.</strong> vient de se connecter.',
					message: null,
					options: {
						autoClose: true,
						delay: 200,
						closeDelay: 2000
					}
				});
			});
		});
		// When user leaves
		socket.on('disconnect', function() {
			console.log(socket_username + " : Disconnect");
			socketsUser[socket_username] = null;
		});
		// New message from client = "write" event
		/*socket.on('write', function(message) {
		 if (socket_username) {
		 sockets.emit('message', socket_username, message, Date.now());
		 } else {
		 socket.emit('error', 'Username is not set yet');
		 }
		 });*/
		socket.emit('reboot', {date: new Date()});
		//socket.emit('news', {hello: "bad"});
		//socket.on('my other event', function(data) {
		//	console.log(data);
		//});
	});
};