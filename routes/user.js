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
    };
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

router.post('/edit/:id', ensureLoggedIn('/auth/login'), checkEditUser(), uploadCloud.single('profilePic'), (req, res, next) => {
    const {firstName, lastName, username, email, phone, oldPassword, password1, password2} = req.body;
    res.send(req.body);
});

router.get('/delete/:id', ensureLoggedIn('/auth/login'), checkEditUser(), (req, res, next) => {
    User.findByIdAndRemove(req.params.id)
        .then(user => {
            // console.log('This user just got deleted: ', user);
            // Missing removing its respective ID from Groups
            user.events.forEach(e => {
                Event.findByIdAndRemove(e)
                    .then(event => {
                        // console.log('This event just got removed: ', event);
                    });
            });
            Event.find({guests: {$in: [user._id]}})
                .then(event => {
                    event.forEach(e => {
                        // console.log('This is the event user is a guest of before deleting user from guests array: Name: ', e.name + 'Guests:', e.guests);
                        // console.log('This is the user\'s ID:', user._id);
                        const index = e.guests.indexOf(user._id);
                        e.guests.splice(index, 1);
                        // console.log('THis is the event after guest is deleted from list :', e.guests);
                        e.save();
                    });
                    res.redirect('/auth/signup');
                })
                .catch(err => {
                    console.log('This error be a hard one, Errors in finding events tied to user to delete reference of user to: ', err);
                    next();
                });
        })
        .catch(err => {
            console.log('Yo watchu doing with these routes?? Users be tryna delete themselves out here: ', err);
            next();
        });
});

module.exports = router;