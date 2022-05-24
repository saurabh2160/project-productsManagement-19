const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const multer = require('multer')
const app = express()

const routes = require('./Routes/routes')
const PORT = process.env.PORT || 3000

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(multer().any())

mongoose.connect("mongodb+srv://animesh-dey98:9I9JRLwql3bINqUX@cluster0.vhmqo.mongodb.net/group19Database",
    { useNewUrlParser: true })

    .then(() => console.log("MongoDB is Connected..."))
    .catch((err) => console.log(err.message))

app.use('/', routes)

app.listen(PORT, () =>
    console.log("Express app is listening on port", PORT))