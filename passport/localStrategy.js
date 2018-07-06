const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User          = require('../models/User');
const bcrypt        = require('bcrypt');

passport.use(new LocalStrategy((username, password, next) => {
  User.findOne({ username }, (err, foundUser) => {
    if (err) {
      next(err);
      return;
    }

    if (!foundUser) {
      next(null, false, { message: 'Incorrect username' });
      return;
    }

    if (!bcrypt.compareSync(password, foundUser.password)) {
      next(null, false, { message: 'Incorrect password' });
      return;
    }

    next(null, foundUser);
  });
}));

function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function validatePasswords(pass1, pass2) {
  return pass1 === pass2;
}

passport.use('local-signup', new LocalStrategy(
  {passReqToCallback: true}, 
  (req, username, password, next) => {
    // to avoid race conditions???
    process.nextTick(() => {
      if (validateEmail(req.body.email) === false){
        return next(null, false, {message: 'Invalid Email'});
      }
      if (validatePasswords(req.body.password, req.body.password2) === false){
        return next(null, false, {message: 'Passwords Don\'t Match'})
      }
      User.findOne({
        'username': username
      }, (err, user) => {
        if (err){return next(err);}

        if (user) {
          return next(null, false);
        } else {
          const {name, username, email, password, groupId} = req.body;
          let profilePic;

          if (req.file) profilePic = req.file.url;
          const hashPass = bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
          const newUser = new User({
            name,
            username, 
            email, 
            password: hashPass, 
            profilePic
          });
          if(groupId) newUser.groups.push(groupId);

          newUser.save((err) => {
            if (err){ next(null, false, { message: newUser.errors}); }
            return next(null, newUser);
          });
        }
      })
    })
    })
  );