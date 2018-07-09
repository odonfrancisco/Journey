const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Event   = require('../models/Event');
const { ensureLoggedIn, ensureLoggedOut} = require('connect-ensure-login');
const uploadCloud = require('../config/cloudinary.js'); 

router.get('/', ensureLoggedIn('/auth/login'), (req, res, next) => {
    Event.find({creatorId: req.session.passport.user}).sort({start: 1})
        .then(event => {
            res.render('events/index', {event});
            console.log(event);
        })
});

router.get('/create', ensureLoggedIn('/auth/login'), (req, res, next) => {
    res.render('events/create');
});

router.post('/create', ensureLoggedIn('/auth/login'), uploadCloud.single('eventPic'), (req, res, next) => {
    const {name, description, startDate, startTime, endDate, endTime, street, apt, city, state, zip} = req.body;
    const address = {street, apt, city, state, zip};
    const start = {
        date: startDate,
        time: startTime
    };
    const end = {
        date: endDate,
        time: endTime
    };
    const creatorId = req.user.id;
    let eventPic;
    if(req.file) {eventPic = req.file.secure_url;}

    const newEvent = new Event({
        creatorId,
        name, 
        description,
        start,
        end,
        eventPic,
        address
    });

    newEvent.save()
        .then(event => {
            res.redirect('/events');
        })
        .catch(err => {
            console.log('Yah nasty bruh, this event\'s too ugly for ya:', err);
            next();
        });
});

router.get('/edit/:id', (req, res, next) => {
    Event.findOne({_id: req.params.id})
        .then(event => {
            User.find({}, {name:1, username: 1})
                .then(users => {
                    let userArr = [];
                    users.forEach(e => {
                        userArr.push(e.username);
                    });
                    // res.send(event);
                    data = {
                        user: userArr,
                        event: event
                    }
                    console.log(userArr);
                    // res.render('events/edit', {event});
                })
                .catch(err => {
                    console.log('Wrecked, the users are busy playing hide n seek:', err);
                    next();
                });
            res.render('events/edit', {event});
        })
        .catch(err => {
            console.log('This event prefers to be private: ', err);
            next();
        });
});

module.exports = router;
