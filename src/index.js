const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const multer = require('multer')
const app = express()
const port = 3000;

const routes = require('./Routes/routes')


app.use(bodyParser.json())
//app.use(bodyParser.urlencoded({ extended: true }))
app.use(multer().any())

mongoose.connect(
    { useNewUrlParser: true })

    .then(() => console.log("MongoDB is Connected...🥳🎉🎈"))
    .catch((err) => console.log(err.message))

app.use('/', routes)

app.listen(port, () => {
    console.log(`Example app listening on port ${port}...🎧🙉🙉`);
});