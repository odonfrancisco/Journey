const cloudinary = require('cloudinary');
const cloudinaryStorage = require('multer-storage-cloudinary');
const multer = require('multer');

// Configures cloudinary in order to upload pictures to cloudinary hosting account
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

var storage = cloudinaryStorage({
    cloudinary: cloudinary,
    folder: 'journey-throwaway',
    allowedFormats: ['jpg', 'png'],
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const uploadCloud = multer({ storage: storage});

module.exports = uploadCloud;