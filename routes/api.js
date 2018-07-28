const express = require('express');
const router = express.Router();
const User    = require('../models/User');
const Event   = require('../models/Event');

router.get('/users', (req, res, next) => {
    User.find()
        .then(user => {
            res.status(200).json(user);
        })
        .catch(err => {
            console.log('Error in finding users API/users', err);

            if (err.errors){
                res.status(400).json(err.errors);
            }
            else {
                res.status(500).json({ error: 'Database error in finding users'});
            }
        });
});

// Route to add comment using axios
router.post('/events/pictures/comment/:picId', (req, res, next) => {
    // Destructure req.body
    const {commentContent} = req.body;
    // Find event by picture Id
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
            pic.comments.unshift(comment);
            // Saves event after adding comment to its picture's comment
            event.save()
                .then(event => {
                    res.send(event);
                })
                .catch(err => {
                    console.log('Wrecked yourself up in tryna save the event after adding that comment to a picture: ', err);
                    next();
                });
        })
        .catch(err => {
            console.log('Error in using Axios to add comment API/', err);
            next();
        });
});

// Route to delete comment using Axios
router.post('/events/pictures/comment/delete/:picId/:commentId', (req, res, next) => {
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
                    res.send(event);
                    // res.redirect(`/events/${event._id}`);
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

// Route to edit comment using axios
router.post('/events/pictures/comment/edit/:picId/:commentId', (req, res, next) => {
    // Destructure req.body
    const {commentContent} = req.body;

    // Find event using picId
    Event.findOne({'pictures._id': req.params.picId})
        .then(event => {
        // Var of pic whose comment to edit
        const pic = event.pictures.id(req.params.picId);
        
        // Edits particular comment within picture
        pic.comments.id(req.params.commentId).content = commentContent;

        // Saves event after editing comment
        event.save()
            .then(event => {
                // res.render('groups/index');
                res.send(event);
            })
            .catch(err => {
                console.log('Error in saving event after using axios to edit a comment within a picture: ', err);
                next();
            });
        })
        .catch(err => {
            console.log('Error in finding event whose comment within picture to edit using axios: ', err)
            next();
        });
});

module.exports = router;