const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const pictureSchema = Schema({
    creatorId: String,
    picName: String,
    picPath: String,
    description: String,
});

const eventSchema = Schema({
    // Group to which it belongs to
    groupId: String,
    // Person who created it
    creatorId: String,
    // Customizable ID for other members to join
    eventId: String,
    name: String,
    description: String,
    start: {
        date: String,
        time: String
    },
    end: {
        date: String,
        time: String
    },
    pictures: [pictureSchema],
    // Will be an array of guest id's apart from family
    guests: [],
    // A banner for the event page
    eventPic: {
        type: String,
        default: 'http://decalpitstop.com/wallpaper/1280x800/pink%20drip.jpg'
    },
    address: {
        street: String,
        apt: String,
        city: String,
        state: String,
        zip: Number
    }
}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;