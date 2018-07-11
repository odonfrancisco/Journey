const express = require('express');
const router = express.Router();
const User    = require('../models/User');
const Event   = require('../models/Event');
const Group   = require('../models/Group');
const { ensureLoggedIn, ensureLoggedOut} = require('connect-ensure-login');
const uploadCloud = require('../config/cloudinary.js'); 

function checkEditUser(){
    return function(req, res, next) {
        if (req.params.id === req.session.passport.user){
            return next();
        } else {
            res.redirect('/auth/login');
        }
    }
}

router.get('/:id', ensureLoggedIn('/auth/login'), (req, res, next) => {
    User.findById(req.params.id).populate('events', 'name').populate('groups', 'name').populate('friends', 'name')
        .then(user => {
            res.render('users/show', {user});
        })
        .catch(err => {
            console.log('Error in finding particular user on userRoutes, check yoself: ', err);
            next();
        });
});

router.get('/edit/:id', ensureLoggedIn('/auth/login'), checkEditUser(), (req, res, next) => {
    User.findById(req.params.id)
        .then(user => {
            res.render('users/edit', {user});
        })
        .catch(err => {
            console.log('Error on the loose in finding particular user to edit:', err);
            next();
        });
});

router.post('/edit/:id', ensureLoggedIn('/auth.login'), checkEditUser(), uploadCloud.single('profilePic'), (req, res, next) => {
    const {firstName, lastName, username, email, phone, oldPassword, password1, password2} = req.body;
    res.send(req.body);
});

module.exports = router;