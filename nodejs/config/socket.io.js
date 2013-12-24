"use strict";

var passportSocketIo = require("passport.socketio"),
		express = require('express'),
		mongoStore = require('connect-mongo')(express),
		config = require('./config');

module.exports = exports = function(server, db) {
	/** WebSocket */
	var sockets = require('socket.io').listen(server, {log: false});

	sockets.set('authorization', passportSocketIo.authorize({
		cookieParser: express.cookieParser,
		key: 'SpeedSession', // the name of the cookie where express/connect stores its session_id
		secret: config.app.secret, // the session_secret to parse the cookie
		store: new mongoStore({
			db: db.connection.db,
			collection: 'session'
		}),
		cookie: {
			maxAge: 36000000
					//expires: new Date(Date.now() + 3600000) //1 Hour
		},
		success: onAuthorizeSuccess, // *optional* callback on success - read more below
		fail: onAuthorizeFail, // *optional* callback on fail/error - read more below
	}));


	sockets.on('connection', function(socket) { // New client
		var socket_username = null;
		// User sends his username
		socket.on('user', function(username) {
			socket_username = username;
			sockets.emit('join', username, Date.now());
		});
		// When user leaves
		socket.on('disconnect', function() {
			console.log("Disconnect");
			if (socket_username) {
				sockets.emit('bye', socket_username, Date.now());
			}
		});
		// New message from client = "write" event
		socket.on('write', function(message) {
			if (socket_username) {
				sockets.emit('message', socket_username, message, Date.now());
			} else {
				socket.emit('error', 'Username is not set yet');
			}
		});
		socket.emit('news', {hello: 'world a tous'});
		socket.on('my other event', function(data) {
			console.log(data);
		});
	});
};


function onAuthorizeSuccess(data, accept) {
	console.log('successful connection to socket.io');

	// The accept-callback still allows us to decide whether to
	// accept the connection or not.
	accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
	if (error)
		throw new Error(message);
	console.log('failed connection to socket.io:', message);

	// We use this callback to log all of our failed connections.
	accept(null, false);
}