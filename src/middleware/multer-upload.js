const multer = require('multer')

const upload = multer({
    //dest: 'profile_pics',  /*automatically saved in req.file.buffer*/
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, callback) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return callback(new Error('Please upload an image!'))
        }
        callback(undefined, true)
    }
})

module.exports = upload