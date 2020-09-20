const express = require('express')
const sharp = require('sharp')

const User = require('../models/User')
const auth = require('../middleware/auth')
const upload = require('../middleware/multer-upload')
const {sendWelcomeEmail, sendGoodbyeEmail} = require('./emails.js')

const router = new express.Router()

// Create user
router.post('/users', async (req, res) => {
    try {
        const user = new User(req.body)
        await user.save()

        // sendWelcomeEmail(user.email, user.name)
        
        const token = await user.generateToken()
        res.status(201).send({user, token})
    }
    catch(error) {
        res.status(400).send({error: error.message})
    }
})

// Login user
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateToken()
        res.send({user, token})
    }
    catch(error) {
        res.status(401).send({error: 'Unable to login!'})
    }

})

//Logout user
router.post('/users/logout', auth, async (req, res) => {
    try {
        const user = req.user
        user.tokens = user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await user.save()
        res.send()
    }
    catch(error) {
        res.status(500).send()
    }
})
// Logout from all devices
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        const user = req.user
        user.tokens = []
        await user.save()
        res.send()
    }
    catch(error) {
        res.status(500).send()
    }
})

// Get user profile
router.get('/users/me', auth, async (req, res) => {
    try {
        res.send(req.user)
    }
    catch {
        res.status(500).send()
    }
})

// Update user
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const validUpdate = updates.every((update) => allowedUpdates.includes(update))

    if(!validUpdate) {
        return res.status(400).send({error: 'Invalid update!'})
    }

    
    try {
        const user = req.user
        // update manually
        updates.forEach((update) => user[update] = req.body[update])
        await user.save()
        
        res.send(user)
    }
    catch(error) {
        res.status(400).send({error: error.message})
    }
})

// Delete user
router.delete('/users/me', auth, async (req, res) => {
    
    try {
        // const _id = req.params.id
        // const user = await User.findByIdAndDelete(_id)
        // if(!user) {
        //     return res.status(404).send()
        // }
        const user = req.user
        await user.remove()

        // sendGoodbyeEmail(user.email, user.name)

        res.send(user)
    }
    catch(error) {
        res.status(500).send(error)
    }
})

// Upload profile pic
router.post('/users/me/profile_pic', auth, upload.single('profile_pic'), async (req, res) => {
    if(!req.file) {
        return res.status(400).send({error: 'Please upload an image!'})
    }
    // req.user.profile_pic = req.file.buffer
    const buffer = await sharp(req.file.buffer)
                        .greyscale(true)
                        .convolve({width: 3, height: 3, kernel: [-1,0,1,-2,0,2,-1,0,1]})
                        .resize(250, 250)
                        .png()
                        .toBuffer()
                        
    req.user.profile_pic = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

// Delete profile pic
router.delete('/users/me/profile_pic', auth, upload.single('profile_pic'), async (req, res) => {
    req.user.profile_pic = undefined
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})

// Show profile pic
router.get('/users/:id/profile_pic', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
        
        if(!user || !user.profile_pic) {
            throw new Error()
        }
        
        res.set('Content-Type', 'image/png')
        res.send(user.profile_pic)
    }
    catch(error) {
        res.status(404).send()
    }
})

module.exports = router