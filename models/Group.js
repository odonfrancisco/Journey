const mongoose = require('mongoose');
const Schema = mongoose.Schema;


// Turns familyId to lowercase
function lowercase(val) {
    if (typeof val !== 'string') val = '';
    return val.toLowerCase();
}

const groupSchema = Schema({
    name: {
        type: String,
        required: true
    },
    // Unique user-set ID for other family members to add themselves to group
    familyId: {
        type: String,
        set: lowercase,
        unique: true
    },
    description: String,
    // Banner for the family, similar to event banner
    groupPic: {
        type: String,
        default: 'http://janetandersoncounseling.com/wp-content/uploads/2013/10/Generic-Family-Photo.jpg' 
    },
    // Array of user Id's for all members of group
    members: [{ type: Schema.Types.ObjectId, ref: 'User'}],
    // Array of event Id's for any event created within family
    events: [{ type: Schema.Types.ObjectId, ref: 'Event'}],
    // Array of attributes for each member. Not entirely sure what i'll use this for yet
    memberAttributes: [{
        memberId: { type: Schema.Types.ObjectId, ref: 'User'},
        attr: Schema.Types.Mixed
    }]
});

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;