/**
 * Generic require login routing middleware
 */
exports.requiresLogin = function(req, res, next) {
    if (!req.isAuthenticated()) {
        //return res.send(401, 'User is not authorized');
		//return res.redirect('index.php');
		return res.redirect('/login');
    }
    next();
};

/**
 * Render HTML authorizations routing middleware
 */
exports.html = {
    hasAuthorization: function(req, res, next) {
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
    hasAuthorization: function(req, res, next) {
        if (req.user.id != req.user.id) {
            return res.send(401, 'User is not authorized');
        }
        next();
    }
};