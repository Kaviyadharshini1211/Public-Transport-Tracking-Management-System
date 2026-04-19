const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        // Search by either googleId OR email
        let user = await User.findOne({ 
          $or: [{ googleId: profile.id }, { email }] 
        });

        if (!user) {
          // Complete new user
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email,
          });
        } else if (!user.googleId) {
          // Linking existing email/password account to Google account
          user.googleId = profile.id;
          if (!user.name && profile.displayName) {
             user.name = profile.displayName;
          }
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// session handling not required if using JWT only
