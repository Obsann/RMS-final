const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/authmodel');
const logger = require('./logger');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile'), null);
        }

        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // Check if a user with the same email already exists (registered via email/password)
        user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          if (user.authProvider === 'local') {
            user.authProvider = 'local'; // Keep as local since they originally registered with password
          }
          if (!user.profilePhoto && profile.photos?.[0]?.url) {
            user.profilePhoto = profile.photos[0].url;
          }
          await user.save();
          return done(null, user);
        }

        // Create new user — goes through admin approval (status: 'pending')
        const username = profile.displayName?.replace(/\s+/g, '_').toLowerCase() ||
          email.split('@')[0];

        // Ensure unique username
        let uniqueUsername = username;
        let counter = 1;
        while (await User.findOne({ username: uniqueUsername })) {
          uniqueUsername = `${username}_${counter}`;
          counter++;
        }

        user = await User.create({
          googleId: profile.id,
          authProvider: 'google',
          username: uniqueUsername,
          email: email.toLowerCase(),
          role: 'resident',
          status: 'approved', // Auto-approved via OAuth
          profilePhoto: profile.photos?.[0]?.url || undefined,
        });

        logger.info(`New Google OAuth user created: ${email} (auto-approved)`);
        return done(null, user);
      } catch (err) {
        logger.error('Google OAuth strategy error:', err);
        return done(err, null);
      }
    }
  )
);

// Serialize/Deserialize (needed for the OAuth redirect handshake)
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
