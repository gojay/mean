var passport = require('passport');
var GithubStrategy = require('passport-github').Strategy;

exports.setup = function(User, config) {
		passport.use(new GithubStrategy({
			clientID    : config.github.clientID,
			clientSecret: config.github.clientSecret,
			callbackURL : config.github.callbackURL
		}, function (accessToken, refreshToken, profile, done) {

			console.log('[github]', accessToken, refreshToken, profile);

			User.findOne({ 'github.id': profile.id }, function (err, user) {
				if(err) return done(err);
				if(!user) {
					user = new User({
						name: profile.displayName,
						email: profile.emails[0].value,
						role: 'user',
						provider: 'github',
						github: profile._json
					});

					user.save(function (err) {
						if(err) return done(err);
						return done(err, user);
					})
				} else {
					return done(err, user);
				}
			});
		}
	))
};