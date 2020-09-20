const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const Task = require('./Task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error('Invalid email!')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0) {
                throw new Error('Age must be a positive number!')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    profile_pic: {
        type: Buffer
    }
}, {
    timestamps: true
})

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

// hash password before saving (doc middleware)
userSchema.pre('save', async function(next) {
    const user = this
    
    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

// delete user's tasks before deleting user (doc middleware)
userSchema.pre('remove', async function(next) {
    const user = this

    await Task.deleteMany({owner: user._id})
    // await user.populate('tasks').execPopulate()
    // user.tasks.forEach((task) => task.remove())

    next()
})

// verify user (created function for 'User')
userSchema.statics.findByCredentials = async function(email, password) {
    const User = this

    const user = await User.findOne({email})

    if(!user) {
        throw new Error()
    }

    const matched = await bcrypt.compare(password, user.password)

    if(!matched) {
        throw new Error()
    }

    return user
}

// generate auth token (created function for 'User' instance)
userSchema.methods.generateToken = async function() {
    const user = this
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET_KEY)

    user.tokens.push({token})
    await user.save()

    return token
}

// filter data when sent to user
userSchema.methods.toJSON = function() {
    const user = this

    // mongoose document --> plain javascript object
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.__v
    delete userObject.profile_pic

    return userObject
}

const User = mongoose.model('User', userSchema)

module.exports = User