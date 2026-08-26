/**
 * Passport Configuration for Multi-Provider Authentication
 * Supports: Google, Facebook, GitHub, Local
 */

const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: FacebookStrategy } = require('passport-facebook');
const { Strategy: GitHubStrategy } = require('passport-github2');
const { Strategy: LocalStrategy } = require('passport-local');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Local Strategy (Email/Password)
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return done(null, false, { message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return done(null, false, { message: 'Invalid credentials' });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return done(null, false, { message: 'Account is disabled' });
    }
    
    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
}));

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
    scope: ['profile', 'email'],
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user
      let user = await User.findOne({ 
        'google.id': profile.id 
      });
      
      if (!user) {
        // Check if email exists
        user = await User.findOne({ 
          email: profile.emails?.[0]?.value 
        });
        
        if (user) {
          // Link Google account to existing user
          user.google = {
            id: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value
          };
          await user.save();
        } else {
          // Create new user
          user = new User({
            name: profile.displayName,
            email: profile.emails?.[0]?.value,
            google: {
              id: profile.id,
              email: profile.emails?.[0]?.value,
              name: profile.displayName,
              avatar: profile.photos?.[0]?.value
            },
            provider: 'google',
            isVerified: true
          });
          await user.save();
        }
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
      );
      
      // Store token in cookie
      if (req.res) {
        req.res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
      }
      
      return done(null, user, { token });
    } catch (error) {
      return done(error, null);
    }
  }));
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || '/api/auth/facebook/callback',
    profileFields: ['id', 'email', 'name', 'displayName', 'photos'],
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user
      let user = await User.findOne({ 
        'facebook.id': profile.id 
      });
      
      if (!user) {
        // Check if email exists
        user = await User.findOne({ 
          email: profile.emails?.[0]?.value 
        });
        
        if (user) {
          // Link Facebook account to existing user
          user.facebook = {
            id: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value,
            accessToken: accessToken
          };
          await user.save();
        } else {
          // Create new user
          user = new User({
            name: profile.displayName,
            email: profile.emails?.[0]?.value || `${profile.id}@facebook.com`,
            facebook: {
              id: profile.id,
              email: profile.emails?.[0]?.value,
              name: profile.displayName,
              avatar: profile.photos?.[0]?.value,
              accessToken: accessToken
            },
            provider: 'facebook',
            isVerified: true
          });
          await user.save();
        }
      } else {
        // Update access token
        user.facebook.accessToken = accessToken;
        await user.save();
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
      );
      
      // Store token in cookie
      if (req.res) {
        req.res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 24 * 60 * 60 * 1000
        });
      }
      
      return done(null, user, { token });
    } catch (error) {
      return done(error, null);
    }
  }));
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback',
    scope: ['user:email', 'user:profile'],
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Find or create user
      let user = await User.findOne({ 
        'github.id': profile.id 
      });
      
      if (!user) {
        // Check if email exists
        user = await User.findOne({ 
          email: profile.emails?.[0]?.value 
        });
        
        if (user) {
          // Link GitHub account to existing user
          user.github = {
            id: profile.id,
            email: profile.emails?.[0]?.value,
            username: profile.username,
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value,
            accessToken: accessToken
          };
          await user.save();
        } else {
          // Create new user
          user = new User({
            name: profile.displayName || profile.username,
            email: profile.emails?.[0]?.value || `${profile.id}@github.com`,
            github: {
              id: profile.id,
              email: profile.emails?.[0]?.value,
              username: profile.username,
              name: profile.displayName,
              avatar: profile.photos?.[0]?.value,
              accessToken: accessToken
            },
            provider: 'github',
            isVerified: true
          });
          await user.save();
        }
      } else {
        // Update access token
        user.github.accessToken = accessToken;
        await user.save();
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
      );
      
      // Store token in cookie
      if (req.res) {
        req.res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 30 * 24 * 60 * 60 * 1000
        });
      }
      
      return done(null, user, { token });
    } catch (error) {
      return done(error, null);
    }
  }));
}

// Generate state for CSRF protection
function generateState() {
  return require('crypto').randomBytes(16).toString('hex');
}

module.exports = {
  passport,
  generateState
};
