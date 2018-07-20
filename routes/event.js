const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Event   = require('../models/Event');
const { ensureLoggedIn, ensureLoggedOut} = require('connect-ensure-login');
const uploadCloud = require('../config/cloudinary.js'); 

// Function to capitalize first letter of word and rest lowercase
function capitalize(val) {
    if (typeof val !== 'string') val = '';
    return val.charAt(0).toUpperCase() + val.substring(1).toLowerCase();
}

// Function to check user's permission to view event
function checkUser(id) {
    return (req, res, next) => {
        Event.findById(req.params.id).populate('pictures.creatorId', 'name username').populate('pictures.comments.creatorId', 'name username').populate('groupId', 'members')
            .then(event => {
                if (event.guests.indexOf(req.session.passport.user) !== -1){
                    req.event = event;
                    return next();
                } else if(event.creatorId == req.session.passport.user){
                    // This is what I use on handlebars to check if user is admin
                    event.yes = true;
                    req.event = event;
                    return next();
                } else if(event.groupId){
                    if (event.groupId.members.indexOf(req.session.passport.user) !== -1){
                        req.event = event;
                        return next();
                    } else {
                        console.log('Not part of groupid')
                        res.redirect('/auth/login');
                    }
                } else {
                    console.log('redirect')
                    res.redirect('/auth/login');
                }
            })
            .catch(err => {
                console.log("Error in finding event when checking if user has permission to view event: ", err);
                next();
            });
    }
}

// Route to display all events a user is a guest of
router.get('/', ensureLoggedIn('/auth/login'), (req, res, next) => {
    // Finds events that the user created or that they're a guest of
    Event.find({$or: [{creatorId: req.session.passport.user}, {guests: {$in: [req.session.passport.user]}}]}).sort({'start.date': 1})
        .then(event => {
            event.forEach(e => {
                // Sets e.yes to true when user is admin of event
                // This is to show edit and delete buttons
                if(e.creatorId == req.session.passport.user){
                    e.yes = true;
                }
            });
            res.render('events/index', {event});
        })
        .catch(err => {
            console.log('Dayum sun you got some work to do, these events be sneakin :', err);
            next();
        });
});

// Route to display a particular event
router.get('/:id', ensureLoggedIn('/auth/login'), checkUser('id'), (req, res, next) => {
    let event = req.event;

    if(event == undefined){
        return next();
    }
    // This is to show edit and delete buttons
        if(event.creatorId == req.session.passport.user){
                event.yes = true;
        }
        res.render('events/show', {event});
});

// Route to display page to create an event
router.get('/create', ensureLoggedIn('/auth/login'), (req, res, next) => {
    res.render('events/create');
});

// Post route to create event 
router.post('/create', ensureLoggedIn('/auth/login'), uploadCloud.single('eventPic'), (req, res, next) => {
    // Destructure req.body
    const {name, description, startDate, startTime, endDate, endTime, street, apt, city, state, zip} = req.body;
    // Create address object
    const address = {street, apt, city, state, zip};
    // Create start object
    const start = {
        date: startDate,
        time: startTime
    };
    // Create end object
    const end = {
        date: endDate,
        time: endTime
    };
    const creatorId = req.user.id;
    // Variable for event banner
    let eventPic;
    // Uploads event banner url only if it was uploaded
    if(req.file) {eventPic = req.file.secure_url;}

    // Creates new event using model constructor 
    let newEvent = new Event({
        creatorId,
        name, 
        description,
        start,
        end,
        eventPic,
        address
    });

    // Adds event id to user's events array
    req.user.events.push(newEvent._id);
    
    // Variable for id of new event. Would be ObjectId(XXXXX) instead of XXXX
    // Will set customizable eventId to event._id to satisfy unique requirement
    const id = newEvent._id.toString();
    newEvent.eventId = id;

    // Saves new event and redirects to user's respective events
    newEvent.save()
        .then(event => {
            res.redirect('/events');
            // Saves user since I added an event id to its events array
            req.user.save();
        })
        .catch(err => {
            console.log('Yah nasty bruh, this event\'s too ugly for ya:', err);
            next();
        });
});

// Route to display the edit page for respective event
router.get('/edit/:id', ensureLoggedIn('/auth/login'), (req, res, next) => {
    // Finds event to be edited
    Event.findOne({_id: req.params.id})
        .then(event => {
            // Then finds all users to be searched through when adding guests to event
            User.find({}, {name:1, username: 1})
                .then(users => {
                    // Array which will hold the usernames of all users in database
                    let userArr = [];
                    users.forEach(e => {
                        userArr.push(e.username);
                    });
                    // Data to be passed to handlebars
                    data = {
                        user: userArr,
                        event: event
                    };
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

// Post route to edit event
router.post('/edit/:id', ensureLoggedIn('/auth/login'), uploadCloud.fields([{name: 'pictures'}, {name: 'eventPic'}]), /* uploadCloud.array('pictures'), uploadCloud.single('eventPic'), */ (req, res, next) => {
    // Destructure req.body
    const {name, description, startDate, startTime, endDate, endTime, street, apt, city, state, zip, eventId} = req.body;
    // Gets array of users that were added as guests from edit form
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

    // Array which will hold each pictureObj
    let pictures = [];

    // If pictures were added to event
    if (req.files.pictures){
        req.files.pictures.forEach(e => {
           const {originalname, secure_url} = e;
           pictureObj = {
               creatorId: req.session.passport.user,
               picName: originalname,
               picPath: secure_url,
           };
           pictures.push(pictureObj); 
        });
    }

    // Variable which will hold the URL for event banner IF uploaded
    let eventPic;
    if (req.files.eventPic) eventPic = req.files.eventPic[0].secure_url;

    // Var for arrray of search queries for the Id of each user
    let allUsers = [];

    // Array which will hold all the user id's found
    let usersArray = [];

    // Var to hold promise statement if users are added to event.
    let find = new Promise((resolve, reject) => {resolve();});

    // If single user is added to event
    if (typeof(users) === 'string') {
        users = capitalize(users);
        // Changes var find to this promise statement in case single user is added
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
            e = capitalize(e);
            userObj = {};
            userObj.username = e;
            allUsers.push(userObj);
        });
    
        userFind = {
            "$or": allUsers
        };
        // console.log('This is userFind: ', userFind);
        
        // Defines var find as a promise statement with all id's of users added
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

    // Promise to find event and update it after users and their Id's are found
    find.then(user => {Event.findByIdAndUpdate(req.params.id, {name, description, address, start, end, eventId})
        .then(event => {
            // If a user was added to event by event admin, then add user(s) id to guests array in event obj
            if (usersArray.length > 0) event.guests.push(...usersArray);

            // If user uploads event banner pic, sets it
            if (req.files.eventPic) event.eventPic = eventPic;

            // If user uploads multiple pictures to event, sets it
            if (req.files.pictures) event.pictures.push(...pictures);

            // Saves event after setting its pictures/users
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
    });
});

// Route to delete event
router.get('/delete/:id', ensureLoggedIn('/auth/login'), (req, res, next) => {
    // Finds event to delete and deletes it. G EZ
    Event.findByIdAndRemove(req.params.id)
        .then(event => {
            res.redirect('/events');
        })
        .catch(err => {
            console.log('Error in deleting event, might have to call a doctor:', err);
            next();
        });
});

// router.post('/pictur', uploadCloud.array('pictures'), (req, res, next) => {
//     console.log(req.files);
//     res.send('ue');
// })

// Route to add pictures to event
router.post('/pictures/add/:id', uploadCloud.array('pictures'), (req, res, next) => {
    // Arr to hold each pictureObj
    let pictures = [];
    
    // If pictures were uploaded, add their objects to arr pictures
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

    // Finds event to add pictures to
    Event.findById(req.params.id)
        .then(event => {
            // If pictures were uploaded, add them to event's pictures
            if (req.files) event.pictures.push(...pictures);
            // Saves event after adding pictures
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

// Route to edit picture info
router.post('/pictures/edit/:eventId/:picId', ensureLoggedIn('/auth/login'), (req, res, next) => {
    // Destructures name of picture and description from req.body
    const {picName, description} = req.body;
    // Finds event whose picture to update
    Event.findById(req.params.eventId, {pictures: {$elemMatch: {_id: req.params.picId}}}, {pictures: 1})
        .then(event => {
            // console.log('This is the event found: ', event);

            // Because I only found the picture I'm editing and not all the event's pictures, 
            // I use event.pictures[0] since it's an array of the only picture found
            event.pictures[0].picName = picName;
            event.pictures[0].description = description;
            // Saves event after editing its respective picture
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

// Route to delete picture 
router.get('/pictures/delete/:picId', ensureLoggedIn('/auth/login'), (req, res, next) => {
    // Finds event to which picture belongs to using the picture id. So much better than
    // passing eventId as a URL param
    Event.findOne({'pictures._id': req.params.picId})
        .then(event => {
            // console.log('Event found :', event.pictures.length);

            // Removes picture requested to be deleted
            event.pictures.id(req.params.picId).remove();
            console.log('Event after deletion:', event.pictures.length);
            // Saves event after deleting its picture
            event.save()
                .then(event => {
                    res.redirect(`/events/${event._id}`);
                })
                .catch(err => {
                    console.log('Error in saving event: ', err);
                    next();
                });
        })
        .catch(err => {
            console.log('Error in finding event using pictures id:' ,err);
            next();
        });
});

// Route to add comment to picture
router.post('/pictures/comment/:picId', ensureLoggedIn('/auth/login'), (req, res, next) => {
    // Destructure req.body
    const {commentContent} = req.body;
    // Find event by pictureId
    Event.findOne({'pictures._id': req.params.picId})
        .then(event => {
            // Var of pic to add comment to
            const pic = event.pictures.id(req.params.picId);
            // var of comment object
            const comment = {
                content: commentContent,
                creatorId: req.session.passport.user
            };
            // Pushes comment obj to var pic 
            pic.comments.push(comment);
            // Saves event after adding comment to its picture's comment
            event.save()
                .then(event => {
                    res.redirect(`/events/${event._id}`);
                })
                .catch(err => {
                    console.log('Wrecked yourself up in tryna save the event after adding that comment to a picture: ', err);
                    next();
                });
        })
        .catch(err => {
            console.log('Couldn\'t find any events in tryna add that comment to a picture, sorry about that: ', err);
            next();
        });
});

// Route to delete comment
router.get('/pictures/comment/delete/:picId/:commentId', ensureLoggedIn('/auth/login'), (req, res, next) => {
    // Find event using picId
    Event.findOne({'pictures._id': req.params.picId})
        .then(event => {
            // console.log('Event found :', event.pictures.id(req.params.picId).comments.length);

            // var of pic whose comment to delete
            const pic = event.pictures.id(req.params.picId);
            // Removes particular comment from picture within event
            pic.comments.id(req.params.commentId).remove();
            // console.log('Event after deletion:', event.pictures.id(req.params.picId));
            // Saves event after deleting respective comment
            event.save()
                .then(event => {
                    res.redirect(`/events/${event._id}`);
                })
                .catch(err => {
                    console.log('Error in saving event: ', err);
                    next();
                });
        })
        .catch(err => {
            console.log('Error in finding event using pictures id:' ,err);
            next();
        });
});

// Route to use with axios to join an event using the eventId
router.post('/join', ensureLoggedIn('/auth/login'), (req, res, next) => {
    const eventId = req.body.eventId.toLowerCase();
    Event.findOne({eventId: eventId})
        .then(event => {
            event.guests.push(req.session.passport.user);
            event.save()
                .catch(err => {
                    console.log('Error in saving event after user attempted to join using eventId: ', err);
                    next();
                });
        })
        .catch(err => {
            console.log('Error in finding event using custom eventId when user tried to join: ', err);
            next();
        });
});

// Route to be used with axios to remove a user from an event it was invited to
router.post('/remove/:userId/:eventId', (req, res, next) => {
    Event.findById(req.params.eventId, {guests:1})
        .then(event => {
            // Gets index of user within event's guests
            let index = event.guests.indexOf(req.params.userId);
            // Removes user from guests array of event
            event.guests.splice(index, 1);
            // Saves event once user is removed from guests array
            event.save()
                .then(event => {
                    res.send(event);
                })
                .catch(err => {
                    console.log('Error in saving event after removing a user from its guests: ', err );
                    next();
                });
        })
        .catch(err => {
            console.log('Error in finding event to remove a user from')
        });
});

module.exports = router;
