const express = require('express')
const mongoose = require('mongoose')

const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
})

const app = express()

// app.use((req, res, next) => {
//     res.status(503).send('Site under maintenance!')
// })

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

app.listen(process.env.PORT, () => {
    console.log(`Server is up on port ${process.env.PORT}!`)
})
