const mongoose = require('mongoose');
const Schema = mongoose.Schema;


function lowercase(val) {
    if (typeof val !== 'string') val = '';
    return val.toLowerCase();
}

const pictureSchema = Schema({
    creatorId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    // Name of picture
    picName: String,
    // Path where image is being hosted through cloudinary
    picPath: String,
    // Description for picture
    description: String,
    // Array of comments tied to picture
    comments: [{
        content: String,
        creatorId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        } 
    }]
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
    // Array of comments for event
    comments: [{
        content: String,
        creatorId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        } 
    }],
    // Name of the event
    name: {
        type: String,
        required: true
    },
    // Description for Event
    description: String,
    // Start date of event
    start: {
        date: {
            type: String,
            required: true
        },
        time: String
    },
    // End date of event
    end: {
        date: {
            type: String,
            required: true
        },
        time: String
    },
    // Array of pictures tied to event
    pictures: [pictureSchema],
    // Array of guest id's apart from group
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
        zip: String
    }
}, {
    timestamps: {
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    }
});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;