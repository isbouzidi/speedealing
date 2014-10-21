/**
 * Generic require login routing middleware
 */

// Only for home url and downloads 
exports.requiresAuthenticate = function (req, res, next) {
	if (!req.isAuthenticated()) {
		//return res.send(401, 'Session expired !');
		return res.redirect('/login');
		//return res.render(401, '/partials/401.html');
	}
	next();
};


// For REST services
exports.requiresLogin = function (req, res, next) {
	if (!req.isAuthenticated()) {
		return res.json(401, {error: 'Session expired !'});
	}
	next();
};

/**
 * Render HTML authorizations routing middleware
 */
exports.html = {
	hasAuthorization: function (req, res, next) {
		if (!req.isAuthenticated()) {
			return res.send(401, 'Session expired !');
		}
		
		// Test d'acces sur le module
		// if (req.profile.id != req.user.id) {
		//return res.render('/partials/401.html');
		//}

		next();
	}
};

/**
 * API authorizations routing middleware
 */
exports.api = {
	hasAuthorization: function (req, res, next) {
		if (req.user.id != req.user.id) {
			return res.send(401, 'User is not authorized');
		}
		next();
	}
};