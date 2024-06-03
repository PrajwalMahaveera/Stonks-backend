const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const pool = require('./db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

passport.use(new LocalStrategy({
  usernameField: process.env.EMAIL,
  passwordField: process.env.PASSWORD
}, async (email, password, done) => {
  try {
    const result = await pool.query('SELECT * FROM profiles WHERE email = $1', [email]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Incorrect password' });
      }
    } else {
      return done(null, false, { message: 'No user with that email' });
    }
  } catch (err) {
    return done(err);
  }
}));

// JWT Strategy
const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
  };
  
  passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [jwt_payload.id]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        return done(null, user);
      } else {
        return done(null, false);
      }
    } catch (err) {
      return done(err, false);
    }
  }));
  
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    try {
      const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [id]);
      done(null, result.rows[0]);
    } catch (err) {
      done(err);
    }
  });
  

module.exports = passport;
