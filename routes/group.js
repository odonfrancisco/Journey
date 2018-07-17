const express = require('express');
const router = express.Router();
const User    = require('../models/User');
const Event   = require('../models/Event');
const Group   = require('../models/Group');
const { ensureLoggedIn, ensureLoggedOut} = require('connect-ensure-login');
const uploadCloud = require('../config/cloudinary.js'); 

// Function to capitalize first letter of word and rest lowercase
function capitalize(val) {
    if (typeof val !== 'string') val = '';
    return val.charAt(0).toUpperCase() + val.substring(1).toLowerCase();
}

// Function to check that user is admin for permission to edit event
function checkUser(id, role){
    return (req, res, next)=>{
        Group.findById(req.params[id]).populate('events', 'guests')
            .then(group => {
                if (group[role].indexOf(req.session.passport.user) !== -1){
                    // This adds the group to the request so I don't have to find
                    // it anymore and I can access it from handlebars
                    req.group = group;
                    return next();
                } else {
                    res.redirect('/auth/login');
                }
            });
    };
}

// Route to show all user's groups
router.get('/', ensureLoggedIn('/auth/login'), (req, res, next) => {
    Group.find({members: req.session.passport.user})
        .then(groups => {
            res.render('groups/index', {groups});
        })
        .catch(err => {
            console.log('Error in finding all groups pertaining to certain user: ', err);
            next();
        });
});

// Route to show form to create group
router.get('/create', ensureLoggedIn('/auth/login'), (req, res, next) => {
    // Finds all users to add to the 'Add members' search field when creating group
    User.find({}, {username:1})
        .then(user => {
            res.render('groups/create', {user});
        })
        .catch(err => {
            console.log('Error in finding all users when rendering create group page: ', err);
            next();
        });
});

// Route to create group when submit form
router.post('/create', ensureLoggedIn('/auth/login'), uploadCloud.single('groupPic'), (req, res, next) => {
    // Destructure body
    const {name, description} = req.body;
    let {users} = req.body;

    // Sets var groupPic to the url of picture uploaded IF uploaded
    let groupPic;
    if(req.file) groupPic = req.file.secure_url;

    let newGroup = new Group({
        name, 
        description,
        groupPic,
    });

    // Adds user who created group to admin array
    newGroup.admin.push(req.session.passport.user);

    // Makes the customizable familyId the id of the group
    // to satisfy its requirement on the backend to be unique
    const id = newGroup._id.toString();
    newGroup.groupId = id;

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
        find = User.find({username: {$in: [users, req.user.username]}}, {_id:1, groups:1})
            .then(user => {
                user.forEach(e => {
                    e.groups.push(newGroup._id);
                    usersArray.push(e._id);
                    e.save()
                        .catch(err => {
                            console.log('Error in saving user after creating a group and adding them as a member as the group and then adding group ID to their groups array: ', err);
                        });
                });
            })
            .catch(err => {
                console.log('Error finding single user to add to members array of group newly created: ', err);
            });
    }

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
        find = User.find(userFind, {_id: 1, groups:1})
            .then(user => {
                user.forEach(e => {
                    user.groups.push(newGroup._id);
                    user.save()
                        .then(user => {
                            usersArray.push(e._id);
                        })
                        .catch(err => {
                            console.log('Error in saving multiple users after adding group they were just added to to their groups array. This is in the creation of the group: ', err);
                            next();
                        })
                    usersArray.push(e._id);
                });
                // console.log('This is the user found using userfind: ', user);
            })
            .catch(err => {
                // console.log('Rip tryna find users using your custom variable: ', err);
            });
    }

    find.then(user => {
        // Adds to members added user(s)
        if(usersArray.length > 0) newGroup.members.push(...usersArray)

        newGroup.save()
            .then(group => {
                res.redirect(`/groups/${group._id}`);
            })
            .catch(err => {
                console.log('Error in saving new group created: ', err);
                next();
            });
    })
    .catch(err => {
        console.log('Error in finding users to be added as members to group newly created: ', err);
        next();
    });
});

// Route to show particular group info
router.get('/:id', ensureLoggedIn('/auth/login'), checkUser('id', 'members'), (req, res, next) => {
    Group.findById(req.params.id).populate('members', 'name username').populate('events', 'name')
        .then(group => {
            if (group.admin.indexOf(req.session.passport.user) !== -1){
                group.yes = true;
            }
            User.find({}, {username:1})
                .then(users => {
                    res.render('groups/show', {group, users})
                })
                .catch(err => {
                    console.log('Error in finding all users in showing a particular group info: ', err);
                    next();
                });
        })
        .catch(err => {
            console.log('Error in finding particular group for whose info to display: ', err);
            next();
        });
});

// Route to display form to add an event to a group
router.get('/events/create/:id', ensureLoggedIn('/auth/login'), checkUser('id', 'members'), (req, res, next) => {
    res.render('events/create');
});

// Route to create new event and save to group
router.post('/events/create/:id', ensureLoggedIn('/auth/login'), checkUser('id', 'members'), uploadCloud.single('eventPic'), (req, res, next) => {
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
        address,
        groupId: req.group._id
    });

    // Variable for id of new event. Would be ObjectId(XXXXX) instead of XXXX
    // Will set customizable eventId to event._id to satisfy unique requirement
    const id = newEvent._id.toString();
    newEvent.eventId = id;

    // Saves new event
    newEvent.save()
        .then(event => {
            // Pushed the event ID to the group's events array
            req.group.events.push(newEvent._id);
            // Saves group after adding the event id
            req.group.save()
                .then(group => {
                res.redirect(`/groups/${group._id}`);
            })
            .catch(err => {
                console.log('Error in saving group after creating a new event for the group: ', err);
                next();
            });
        })
        .catch(err => {
            console.log('Error in saving event after creating it for a group:', err);
            next();
        });
});

// Route to view form to edit group
router.get('/edit/:id', ensureLoggedIn('/auth/login'), checkUser('id', 'admin'), (req, res, next) => {
    User.find({groups: req.params.id}, {username:1})
        .then(users => {
            res.render('groups/edit', {users})
        })
        .catch(err => {
            console.log('Error in finding users to put into edit group info: ', err);
            next();
        });
});

// Route to edit group once form is submitted
router.post('/edit/:id', ensureLoggedIn('/auth/login'), checkUser('id', 'admin'), uploadCloud.single('groupPic'), (req, res, next) => {
    // Destructure Body
    const {name, description, groupId} = req.body;

    let {users} = req.body;

    // Defines groupPic and makes it equal to url of image uploaded IF image was uploaded
    let groupPic;
    if (req.file) groupPic = req.file.secure_url;

    // Var for arrray of search queries for the Id of each user
    let allUsers = [];

    // Array which will hold all the user id's found
    let usersArray = [];    

    // Var to hold promise statement if users are added to event.
    let find = new Promise((resolve, reject) => {resolve();});

    // If single user is added as admin
    if (typeof(users) === 'string') {
        users = capitalize(users);
        // Changes var find to this promise statement in case single user is added
        find = User.findOne({username: users}, {_id:1, groups:1})
            .then(user => {
                usersArray.push(user._id);
                user.save()
                    .catch(err => {
                        console.log('Error in saving user after creating a group and adding them as a member as the group and then adding group ID to their groups array: ', err);
                    });
            })
            .catch(err => {
                console.log('Error finding single user to add to members array of group newly created: ', err);
            });
    }

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
        find = User.find(userFind, {_id: 1, groups:1})
            .then(user => {
                user.forEach(e => {
                    user.save()
                        .then(user => {
                            usersArray.push(e._id);
                        })
                        .catch(err => {
                            console.log('Error in saving multiple users after adding group they were just added to to their groups array. This is in the creation of the group: ', err);
                            next();
                        })
                    usersArray.push(e._id);
                });
                // console.log('This is the user found using userfind: ', user);
            })
            .catch(err => {
                // console.log('Rip tryna find users using your custom variable: ', err);
            });
    }

    find.then(user => {
        Group.findByIdAndUpdate(req.group._id, {
            name, 
            description,
            groupId
        })
        .then(group => {
            if (req.file) group.groupPic = groupPic;
            console.log('UsersArray: ', usersArray);
            if (usersArray.length > 0){
                group.admin.push(...usersArray);
            }
            group.save()
                .catch(err => {
                    console.log('Error in saving group after attempting to update it with edited info: ', err);
                    next();
                })
                .then(group => {
                    res.redirect(`/groups/${group._id}`)
                });
        })
        .catch(err => {
            console.log('Error in updating group after attempting to edit it: ', err);
            next();
        });
    })
    .catch(err => {
        console.log('Error in executing after \'find\' promise in updating group after submitting an edit: ', err);
        next();
    });
});

// Route to remove member from a group
router.get('/members/delete/:groupId/:memberId', ensureLoggedIn('/auth/login'), checkUser('groupId', 'admin'), (req, res, next) =>{
    // Finds user to remove from group
    User.findById(req.params.memberId)
        .then(user => {
            // index of the groupId in user's 'groups' array
            const index = user.groups.indexOf(req.params.groupId);
            // Removes the groupId from user's 'group's array
            user.groups.splice(index, 1);
            // Saves user after removing groupId
            user.save()
                .then(user => {
                    // Index of memberId in group's 'members' array
                    const index = req.group.members.indexOf(req.params.memberId);
                    // Removes memberId from group's 'members' array
                    req.group.members.splice(index, 1);
                    // Saves group then redirects to particular groups page
                    req.group.save()
                        .then(group => {
                            res.redirect(`/groups/${group._id}`);
                        })
                        .catch(err => {
                            console.log('Error in saving group after removing user from group and saving the user after deleting group id from its groups array: ', err);
                            next();
                        });
                })
                .catch(err => {
                    console.log('Error in saving user found in attempting to remove user from a group: ', err);
                    next();
                });
        })
        .catch(err => {
            console.log('Error in finding user to remove from a group: ', err);
            next();
        });
});

// Route to use with axios to add members to a group
router.post('/members/add/:groupId', ensureLoggedIn('/auth/login'), checkUser('groupId', 'admin'), (req, res, next) => {
    // Destructure req.body
    let {users} = req.body;

    // Var for arrray of search queries for the Id of each user
    let allUsers = [];

    // Array which will hold all the user id's found
    let usersArray = [];    

    // Var to hold promise statement if users are added to group.
    let find = new Promise((resolve, reject) => {resolve();});

    // If more than one user is added to group
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
        find = User.find(userFind, {_id: 1, groups:1})
            .then(user => {
                user.forEach(e => {
                    e.groups.push(req.group._id);
                    e.save()
                        .then(user => {
                            usersArray.push(user._id);
                        })
                        .catch(err => {
                            console.log('Error in saving multiple users after adding group they were just added to to their groups array. This is in the creation of the group: ', err);
                            next();
                        })
                    usersArray.push(e._id);
                });
                // console.log('This is the user found using userfind: ', user);
            })
            .catch(err => {
                // console.log('Rip tryna find users using your custom variable: ', err);
            });
    }

    find.then(user => {
        req.group.members.push(...usersArray);
        req.group.save()
            .then(group => {
                res.send(group);
                // res.redirect(`/groups/${group._id}`)
            })
            .catch(err => {
                console.log('Error in saving group after ONLY adding a member to it: ', err);
                next();
            });
    })
    .catch(err => {
        console.log('Error in finding users to add to group when ONLY adding members to group: ', err);
        next();
    });

});

// Route to remove event from group
router.get('/events/remove/:groupId/:eventId', ensureLoggedIn('/auth/login'), checkUser('groupId', 'admin'), (req, res, next) => {
    // Finds event to remove from group
    Event.findById(req.params.eventId)
        .then(event => {
            event.groupId = null;
            event.save()
                .then(event => {
                    // Finds index of event within group's events array
                    // Group is passed in the request in my checkUser middleware
                    const index = req.group.events.indexOf(event._id);
                    // Removes event ID from group's events array
                    req.group.events.splice(index, 1);
                    // Saves group after deleting event from its events array
                    req.group.save()
                        .then(group => {
                            res.redirect(`/groups/${group._id}`);
                        })
                        .catch(err => {
                            console.log('Error in saving group after removing event from group:', err);
                            next();
                        });
                })
                .catch(err => {
                    console.log('Error in saving event after removing its attachment to a groupId: ', err);
                    next();
                });
        })
        .catch(err => {
            console.log('Error in finding event whom to remove from group and remove groupId: ', err);
            next();
        });
});

module.exports = router;