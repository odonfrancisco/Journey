const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

function capitalize(val) {
  if (typeof val !== 'string') val = '';
  return val.charAt(0).toUpperCase() + val.substring(1);
}

const userSchema = new Schema({
  name: {
    first: {
      type: String,
      set: capitalize,
      required: true
    },
    last: {
      type: String,
      set: capitalize,
      required: true
    }
  },
  username: {
    type: String,
    unique: true,
    required : true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  phone: String,
  events: [{ type: Schema.Types.ObjectId, ref: 'Event'}],
  groups: [{ type: Schema.Types.ObjectId, ref: 'Group'}],
  friends: [{ type: Schema.Types.ObjectId, ref: 'User'}],
  profilePic: {
    type: String, 
    default: "https://wallpapertag.com/wallpaper/full/7/b/a/947973-mac-default-wallpapers-2560x1600-free-download.jpg"
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;