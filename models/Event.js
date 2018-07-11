const mongoose = require('mongoose');
const Schema = mongoose.Schema;


function lowercase(val) {
    if (typeof val !== 'string') val = '';
    return val.toLowerCase();
}

const pictureSchema = Schema({
    creatorId: String,
    picName: String,
    picPath: String,
    description: String,
});

const eventSchema = Schema({
    // Group to which it belongs to
    groupId: {
        type: Schema.Types.ObjectId,
        ref: 'Group'
    },
    // Person who created it
    creatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Customizable ID for other members to join
    eventId: {
        type: String,
        set: lowercase,
        unique: true
    },
    comments: [{
        content: String,
        creatorId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        } 
    }],
    name: {
        type: String,
        required: true
    },
    description: String,
    start: {
        date: {
            type: String,
            required: true
        },
        time: String
    },
    end: {
        date: {
            type: String,
            required: true
        },
        time: String
    },
    pictures: [pictureSchema],
    // Will be an array of guest id's apart from family
    guests: [{ type: Schema.Types.ObjectId, ref: 'User'}],
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