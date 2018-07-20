const express = require('express');
const router = express.Router();
const User    = require('../models/User');
const Event   = require('../models/Event');
const Group   = require('../models/Group');
const { ensureLoggedIn, ensureLoggedOut} = require('connect-ensure-login');
const uploadCloud = require('../config/cloudinary.js'); 
const bcrypt = require('bcrypt');

// Function to capitalize first letter of word and rest lowercase
function capitalize(val) {
    if (typeof val !== 'string') val = '';
    return val.charAt(0).toUpperCase() + val.substring(1).toLowerCase();
}

// Function to check if user is authorized to view certain page such as edit and delete
function checkEditUser(){
    return function(req, res, next) {
        if (req.params.id === req.session.passport.user){
            return next();
        } else {
            res.redirect('/auth/login');
        }
    };
}

// Route to display particular user info
router.get('/:id', ensureLoggedIn('/auth/login'), (req, res, next) => {
    // Finds user and populates its events and groups with their names and friends with their name and username
    User.findById(req.params.id).populate('events', 'name').populate('groups', 'name').populate('friends', 'name username')
        .then(user => {
            // Checks if user is viewing their own page. If they are, 
                // allows edit and delete button on their page
            if (user._id == req.session.passport.user){
                user.yes = true;    
            }
            // Checks that user is a friend of profile being viewed
            if (user.friends.indexOf(req.session.passport.user) >= 0 || user._id == req.session.passport.user){
                            // Finds all events a user is a guest of
                Event.find({guests: {$in: [user._id]}}, {guests:1, name:1})
                    .then(events => {
                      res.render('users/show', {user, events});  
                    })
                    .catch(err => {
                        console.log('Error in finding events user is a guest of: ', err);
                        next();
                    });
            // Else redirects to active user's profile page
            } else {
                // NEED TO WORK ON ERROR MESSAGE APPEARING
                res.redirect(`/users/${req.session.passport.user}`);
            }
        })
        .catch(err => {
            console.log('Error in finding particular user on userRoutes, check yoself: ', err);
            next();
        });
});

// Route to show edit field of user
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

// Post route to edit user. So strange it's not done as I'm writing this but no worries it's fixed
router.post('/edit/:id', ensureLoggedIn('/auth/login'), checkEditUser(), uploadCloud.single('profilePic'), (req, res, next) => {
    // Function to validate that email is indeed an email
    function validateEmail(email) {
        // Regular expression email should be equal to
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
      }
      
    // Function to check that email isn't already being used by another user
    function emailRepeat(email){
        return User.findOne({'email':  email})
            .then(user => {
                // Checks if a user was found and if it equals the user being edited
                if (user !== null && user._id !== req.params.id){
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
    
    // Function that ensures user validates their password
    function validatePasswords(pass1, pass2) {
        return pass1 === pass2;
    }

    // if (validateEmail(req.body.email) === false){
    //     return next(null, false, {message: 'Invalid Email'});
    //   }

    // Checks that email isn't already in use
    if (emailRepeat(req.body.email) === true){
        return next(null, false, {message: 'This Email is already in use'});
    }

    // Checks that User validates their password
    if(req.body.password && req.body.password2){
        if (validatePasswords(req.body.password, req.body.password2) === false){
            return next(null, false, {message: 'Passwords Don\'t Match'});
        }
    }

    const {firstName, lastName, username, email, phone, oldPassword, password1, password2} = req.body;

    const name = {
        first: firstName,
        last: lastName
    }

    User.findByIdAndUpdate(req.params.id, {username, email, phone})
        .then(user => {
            // Checks that oldPassword inputted by user is the same as their actual password
            if(password1 && password2){
                if (!bcrypt.compareSync(oldPassword, user.password)) {
                    next(null, false, { message: 'Incorrect password' });
                    return;
                }
            }
            // Sets user's name to the name object line 100
            user.name = name;
            // Creates a new hash for the new password
            if (password1 && password2){
                const hashPass = bcrypt.hashSync(password1, bcrypt.genSaltSync(10), null);
                user.password = hashPass;
            }

            if(req.file){
                user.profilePic = req.file.secure_url;
            }

            // Saves user and their edited info
            user.save()
                .then(user => {
                    res.redirect(`/users/${user._id}`)
                })
                .catch(err => {
                    console.log('Saving users after attempting to update them will only make them rebel harder: ', err)
                    next();
                });
        })
        .catch(err => {
            console.log('Gots an error wit finding yur user and updating them: ', err);
            next();
        })
});

// Route to delete a user :(
router.get('/delete/:id', ensureLoggedIn('/auth/login'), checkEditUser(), (req, res, next) => {
    User.findByIdAndRemove(req.params.id)
        .then(user => {
            // Missing removing its respective ID from Groups

            // This deletes every event that was created by this deleted user
            user.events.forEach(e => {
                Event.findByIdAndRemove(e)
                    .then(event => {
                        // console.log('This event just got removed: ', event);
                    });
            });

            // This deletes the user's reference from any events they're a guest of
            Event.find({guests: {$in: [user._id]}})
                .then(event => {
                    event.forEach(e => {
                        // console.log('This is the event user is a guest of before deleting user from guests array: Name: ', e.name + 'Guests:', e.guests);
                        // console.log('This is the user\'s ID:', user._id);

                        // Finds index of user in guest array and deletes that element
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

// Route to add a friend
router.post('/add/friend/:id', ensureLoggedIn('/auth/login'), checkEditUser(), (req, res, next) => {
    // Array of usernames that user added
    let users = req.body;

    // Var for arrray of search queries per user for their Id
    let allUsers = [];

    // Array which will hold all the id's found
    let usersArray = [];

    // Var to hold promise statement if users are added to event.
    let find = new Promise((resolve, reject) => {resolve();});


    // console.log('Type of user: ', typeof(users));
    // console.log('Users:', users);

    // If single user is added to event
    if (typeof(users.users) == 'string') {
        users = capitalize(users.users);
        find = User.findOne({username: users}, {_id:1})
            .then(user => {
                usersArray.push({
                    '_id': user._id 
                });
                // console.log('usersArray from one added friend: ', usersArray);
            })
            .catch(err => {
                console.log('Error finding single user: ', err);
            });
    }

    // If more than one user is added to event
    if (typeof(users.users) === 'object') {
        users.users.forEach(e => {
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

    // console.log(usersArray);
    // console.log(allUsers);

    // Promise to find event and update it after users and their Id's are found
    find.then(user => User.findById(req.params.id)
        .then(user => {
            // Adds users id's to friends array
            user.friends.push(...usersArray);
            // console.log('user.friends after pushing usersArray: ', user.friends)
            // Saves user after adding its friends
            user.save()
                .then(user => {
                    res.redirect(`/users/${user._id}`);
                })
                .catch(err => {
                    console.log('Error in saving friend afterpushing usersArray: ', err);
                    next();
                });
        })
        .catch(err => {
            console.log('Watchu doing up in here, this user is an introvert and don\'t need no friends:', err);
            next();
        })
    )
});

// Route to delete friend from user's friend array
router.get('/friends/delete/:id/:friendId', checkEditUser(), (req, res, next) => {
    User.findById(req.params.id)
        .then(user => {
            // Finds index of friend within user's friends array
            const index = user.friends.indexOf(req.params.friendId);
            // Deletes ID from friends array
            user.friends.splice(index, 1);
            // Save User after deleting the friend from its array
            user.save()
                .then(user => {
                    res.redirect(`/users/${user._id}`);
                })
                .catch(err => {
                    console.log('Error in saving user after deleting its friend. Guest they\'re too attached: ', err);
                    next();
                });
        })
        .catch(err => {
            console.log('Error in finding user whose friend to delete: ', err);
            next();
        });
});



module.exports = router;