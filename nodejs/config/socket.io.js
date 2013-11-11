"use strict";

module.exports = exports = function(server) {
	/** WebSocket */
	var sockets = require('socket.io').listen(server, {log: false}).of('/notification');
	sockets.on('connection', function(socket) { // New client
		var socket_username = null;
		// User sends his username
		socket.on('user', function(username) {
			socket_username = username;
			sockets.emit('join', username, Date.now());
		});
		// When user leaves
		socket.on('disconnect', function() {
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