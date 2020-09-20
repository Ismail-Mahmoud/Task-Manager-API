const express = require('express')
const router = new express.Router()

const Task = require('../models/Task')
const auth = require('../middleware/auth')

// Create task
router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    }
    catch(error) {
        res.status(400).send(error)
    }
})

// Get /tasks
// Get /tasks?completed=false
// Get /tasks?limit=2&skip=1
// Get /tasks?sortBy=createdAt_asc
router.get('/tasks', auth, async (req, res) => {
    const sort = {}
    const match = {}

    const completed = req.query.completed
    const limit = parseInt(req.query.limit)
    const skip = parseInt(req.query.skip)
    const sortBy = req.query.sortBy

    if(completed) {
        if(completed !== 'true' && completed !== 'false') {
            return res.status(400).send({error: 'Invalid completed value!'})
        }
        // match.completed = completed
        match.completed = completed === 'true'
    }
    
    if(sortBy) {
        // sort: {createdAt: 1}
        const parts = sortBy.split('_')
        sort[parts[0]] = parts[1] === 'desc'? -1 : 1
    }

    try {
        const user = req.user

        await user.populate({
            path: 'tasks',
            match,
            options: {limit, skip, sort}
        }).execPopulate()
        
        res.send(user.tasks)
    }
    catch(error) {
        res.status(500).send(error)
    }
})

// Get task by id
router.get('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id})
        if(!task) {
            return res.status(404).send()
        }
        res.send(task)
    }
    catch(error) {
        res.status(500).send(error)
    }
})

// Update task
router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const validUpdate = updates.every((update) => allowedUpdates.includes(update))

    if(!validUpdate) {
        return res.status(400).send({error: 'Invalid update!'})
    }

    try {
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id})
        if(!task) {
            return res.status(404).send()
        }
        // update manually
        updates.forEach((update) => task[update] = req.body[update])
        await task.save()

        res.send(task)
    }
    catch(error) {
        res.status(400).send(error)
    }
})

// Delete task
router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})
        if(!task) {
            return res.status(404).send()
        }
        res.send(task)
    }
    catch(error) {
        res.status(500).send(error)
    }
})

module.exports = router