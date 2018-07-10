const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User          = require('../models/User');
const bcrypt        = require('bcrypt');

passport.use(new LocalStrategy((username, password, next) => {
  username = username.toLowerCase();
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

function emailRepeat(email){
  return User.findOne({'email':  email})
    .then(user => {
      if (user !== null){
        // console.log('User exists:', user);
        return false;
      } else{
        // console.log('NULL User:', user);
        return true;
      }
    })
    .catch(err => {
      console.log('Email issues, check again:', err);
      // next(); 
    });
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
      if (emailRepeat(req.body.email) === true){
        return next(null, false, {message: 'This Email is already in use'});
      }
      if (validatePasswords(req.body.password, req.body.password2) === false){
        return next(null, false, {message: 'Passwords Don\'t Match'});
      }

      User.findOne({
        'username': username
      }, (err, user) => {
        if (err){return next(err);}

        if (user) {
          return next(null, false);
        } else {
          const {name, email, phone, password, groupId} = req.body;
          let profilePic;
          console.log('Username before lowercase: ', req.body.username)
          let username = req.body.username.toLowerCase();

          if (req.file) profilePic = req.file.url;
          const hashPass = bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
          const newUser = new User({
            name,
            username, 
            email,
            phone,
            password: hashPass, 
            profilePic
          });
          if(groupId) newUser.groups.push(groupId);

          newUser.save((err) => {
            if (err){ next(null, false, { message: newUser.errors}); }
            return next(null, newUser);
          });
        }
      });
    });
    })
  );