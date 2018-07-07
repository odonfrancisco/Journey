const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dateSchema = Schema({
    date: Number,
    time: Number
});

const pictureSchema = Schema({
    creatorId: String,
    picName: String,
    picPath: String,
    description: String,
});

const addressSchema = Schema({
    street: String,
    apt: String,
    city: String,
    state: String,
    zip: Number
});

const eventSchema = Schema({
    groupId: String,
    creatorId: String,
    eventId: String,
    name: String,
    description: String,
    start: dateSchema,
    end: dateSchema,
    pictures: [pictureSchema],
    // Will be an array of guest id's apart from family
    guests: [],
    // A banner for the event page
    eventPic: {
        type: String,
        default: 'http://decalpitstop.com/wallpaper/1280x800/pink%20drip.jpg'
    },
    address: addressSchema
}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;