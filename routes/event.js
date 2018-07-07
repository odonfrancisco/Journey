const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Event   = require('../models/Event');
const { ensureLoggedIn, ensureLoggedOut} = require('connect-ensure-login');
const uploadCloud = require('../config/cloudinary.js'); 

router.get('/', ensureLoggedIn('/login'), (req, res, next) => {
  res.render('events/index');
});

router.get('/create', ensureLoggedIn('/login'), (req, res, next) => {
    res.render('events/create');
});

router.post('/create', ensureLoggedIn('/login'), (req, res, next) => {
    const {name, description, startDate, startTime, endDate, endTime, eventPic, street, apt, city, state, zip} = req.body;
    
})

module.exports = router;
