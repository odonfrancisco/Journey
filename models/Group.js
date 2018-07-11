const mongoose = require('mongoose');
const Schema = mongoose.Schema;


function lowercase(val) {
    if (typeof val !== 'string') val = '';
    return val.toLowerCase();
}

const groupSchema = Schema({
    name: {
        type: String,
        required: true
    },
    familyId: {
        type: String,
        set: lowercase,
        unique: true
    },
    description: String,
    profilePic: {
        type: String,
        default: 'http://janetandersoncounseling.com/wp-content/uploads/2013/10/Generic-Family-Photo.jpg' 
    },
    members: [{ type: Schema.Types.ObjectId, ref: 'User'}],
    events: [{ type: Schema.Types.ObjectId, ref: 'Event'}],
    memberAttributes: [{
        memberId: { type: Schema.Types.ObjectId, ref: 'User'},
        attr: Schema.Types.Mixed
    }]
});