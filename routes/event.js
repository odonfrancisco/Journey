const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Event   = require('../models/Event');
const { ensureLoggedIn, ensureLoggedOut} = require('connect-ensure-login');
const uploadCloud = require('../config/cloudinary.js'); 

router.get('/', ensureLoggedIn('/auth/login'), (req, res, next) => {
    Event.find({$or: [{creatorId: req.session.passport.user}, {guests: {$in: [req.session.passport.user]}}]}).sort({start: 1})
        .then(event => {
            event.forEach(e => {
                if(e.creatorId == req.session.passport.user){
                    e.yes = true;
                }
            });
            res.render('events/index', {event});
        })
        .catch(err => {
            console.log('Dayum sun you got some work to do, these events be sneakin :', err);
            next();
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

    let newEvent = new Event({
        creatorId,
        name, 
        description,
        start,
        end,
        eventPic,
        address
    });

    req.user.events.push(newEvent._id);
    
    const id = newEvent._id.toString();

    newEvent.eventId = id;

    newEvent.save()
        .then(event => {
            res.redirect('/events');
            req.user.save();
        })
        .catch(err => {
            console.log('Yah nasty bruh, this event\'s too ugly for ya:', err);
            next();
        });
});

router.get('/edit/:id', ensureLoggedIn('/auth/login'), (req, res, next) => {
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
                    };
                    // console.log(userArr);
                    // console.log(data);
                    res.render('events/edit', {data});
                })
                .catch(err => {
                    console.log('Wrecked, the users are busy playing hide n seek:', err);
                    next();
                });
            // res.render('events/edit', {event});
        })
        .catch(err => {
            console.log('This event prefers to be private: ', err);
            next();
        });
});

router.post('/edit/:id', ensureLoggedIn('/auth/login'), uploadCloud.array('pictures'), /* uploadCloud.single('eventPic'), */ (req, res, next) => {
    const {name, description, startDate, startTime, endDate, endTime, street, apt, city, state, zip} = req.body;
    let users = req.body.users;
    const address = {
        street, apt, city, state, zip
    };
    const start = {
        date: startDate,
        time: startTime
    };
    const end = {
        date: endDate,
        time: endTime
    };

    let pictures = [];

    console.log(req.files);
    if (req.files){
        req.files.forEach(e => {
           const {originalname, secure_url} = e;
           pictureObj = {
               creatorId: req.session.passport.user,
               picName: originalname,
               picPath: secure_url,
           };
           pictures.push(pictureObj); 
        });
    }

    let eventPic;
    if (req.file) eventPic = req.file.secure_url;

    // Var for arrray of search queries per user for their Id
    let allUsers = [];

    // Array which will hold all the id's found
    let usersArray = [];

    let find = new Promise((resolve, reject) => {resolve();});

    // If single user is added to event
    if (typeof(users) === 'string') {
        users = users.toLowerCase();
        find = User.findOne({username: users}, {_id:1})
            .then(user => {
                usersArray.push(user._id);
            })
            .catch(err => {
                console.log('Error finding single user: ', err);
            });
    }

    // console.log('Does users equal object: ', typeof(users) == 'object');
    // console.log('This is users:', users);
    // console.log('Type of users', typeof(users))

    // If more than one user is added to event
    if (typeof(users) === 'object') {
        users.forEach(e => {
            e = e.toLowerCase();
            userObj = {};
            userObj.username = e;
            allUsers.push(userObj);
        });
    
        userFind = {
            "$or": allUsers
        };
        // console.log('This is userFind: ', userFind);
    
        find = User.find(userFind, {_id: 1})
            .then(user => {
                user.forEach(e => {
                    usersArray.push(e._id);
                });
                console.log('This is the user found using userfind: ', user);
            })
            .catch(err => {
                console.log('Rip tryna find users using your custom variable: ', err);
            });
    }


    find.then(user => {Event.findByIdAndUpdate(req.params.id, {name, description, address, start, end})
        .then(event => {
            // If a user was added to event by event admin, then add user(s) id to guests array in event obj
            if (usersArray.length > 0) event.guests.push(...usersArray);

            if (req.file) event.eventPic = eventPic;

            if (req.files) event.pictures.push(...pictures);

            event.save()
                .then(event => {
                    // console.log('This is the usersArray:', usersArray)
                    res.redirect(`/events/`/* ${event._id} */);
                })
                .catch(err => {
                    console.log('Error with saving event:', err);
                    next();
                });
        })
        .catch(err => {
            console.log('Error with updating event:', err);
            next();
        });
    })
});

router.get('/delete/:id', ensureLoggedIn('/auth/login'), (req, res, next) => {
    Event.findByIdAndRemove(req.params.id)
        .then(event => {
            res.redirect('/events');
        })
        .catch(err => {
            console.log('Error in deleting event, might have to call a doctor:', err);
            next();
        });
});

router.get('/:id', ensureLoggedIn('/auth/login'), (req, res, next) => {
    Event.findById(req.params.id).populate('pictures.creatorId', 'name')
        .then(event => {
            if(event.creatorId == req.session.passport.user){
                    event.yes = true;
            }
            res.render('events/show', {event});
        })
        .catch(err => {
            console.log('Error in getting particular event: wassup: ', err);
            next();
        });
});

router.post('/pictures/add/:id', uploadCloud.array('pictures'), (req, res, next) => {
    let pictures = [];
    
    if (req.files){
        req.files.forEach(e => {
           const {originalname, secure_url} = e;
           pictureObj = {
               creatorId: req.session.passport.user,
               picName: originalname,
               picPath: secure_url,
           };
           pictures.push(pictureObj); 
        });
    }

    Event.findById(req.params.id)
        .then(event => {
            if (req.files) event.pictures.push(...pictures);
            event.save()
                .then(event => {
                    res.redirect(`/events/${event._id}`);
                })
                .catch(err => {
                    console.log('Issues saving event after adding ONLY pictures to it: ', err);
                    next();
                });
        })
        .catch(err => {
            console.log('Error in finding event to add ONLY pictures to by ID:', err);
            next();
        });
});

router.post('/pictures/edit/:eventId/:picId', ensureLoggedIn('/auth/login'), (req, res, next) => {
    const {picName, description} = req.body;
    Event.findById(req.params.eventId, {pictures: {$elemMatch: {_id: req.params.picId}}}, {pictures: 1})
        .then(event => {
            // console.log('This is the event found: ', event);
            event.pictures[0].picName = picName;
            event.pictures[0].description = description;
            event.save()
                .then(event => {
                    res.redirect(`/events/${event._id}`);
                })
                .catch(err => {
                    console.log('Error in saving the event: ', err);
                    next();
                });
        })
        .catch(err => {
            console.log('Error in finding event associated to picture: ', err);
            next();
        });
});

router.get('/pictures/delete/:eventId/:picId', ensureLoggedIn('/auth/login'), (req, res, next) => {
    Event.findById(req.params.eventId, {pictures: {$elemMatch: {_id: req.params.picId}}}, {pictures: 1})
        .then(event => {
            console.log('Event before deleting picture: ', event);
            event.pictures[0].remove();
            Event.update()
                .then(event => {
                    res.redirect(`/events/${req.params.eventId}`);
                    console.log('Event updated: ', event);
                })
                .catch(err => {
                    console.log('Error in saving event after deleting picture: ', err);
                    next();
                });
            console.log("Event after deleting pictures: ", event);
        })
        .catch(err => {
            console.log('Error in finding by Id: ', err);
            next();
        });
})

module.exports = router;
