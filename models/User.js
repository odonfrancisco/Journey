const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const userSchema = new Schema({
  name: String,
  username: String,
  password: String,
  email: String,
  phone: String,
  events: [],
  groups: [],
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