const userModel = require('../Models/userModel')
const { uploadFile } = require('../AWS_S3/awsUpload')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const saltRounds = 10

const createUser = async (req, res) => {
    try {
        let data = req.body
        let file = req.files
        let { fname, lname, email, profileImage, phone, password, address } = data
        if (!data) return res.status(400).send({ status: false, message: "Enter data for creating user" })
        if (Object.keys(data).length == 0)
            return res.status(400).send({ status: false, message: "Form data cannot be empty" })
        let phoneCheck = await userModel.findOne({ phone: phone })
        if (phoneCheck) {
            if (phoneCheck.phone == phone) return res.status(400).send({ status: false, message: "phone number already exist" })
        }
        let emailCheck = await userModel.findOne({ email: email })
        if (emailCheck) {
            if (emailCheck.email == email) return res.status(400).send({ status: false, message: "email already exist" })
        }
        if (!file && file.length == 0) return res.status(400).send({ status: false, message: "upload profile image" })
        let uploadedFileURL = await uploadFile(file[0])
        let obj = {
            fname,
            lname,
            email,
            profileImage: uploadedFileURL,
            phone,
            password,
            address: JSON.parse(address)
        }
        const result = await userModel.create(obj)
        res.status(201).send({ status: true, data: result })
    }
    catch (e) {
        console.log(e.message)
        res.status(500).send({ status: false, message: e })
    }
}



//----Login
const loginUser = async function (req, res) {
    try {
        let email = req.body.email;
        let password = req.body.password;
        if (!validation.isValidRequest(req.body)) return res.status(400).send({ status: false, message: "No input by user" })
        if (!validation.isValidValue(userId)) return res.status(400).send({ status: false, msg: "email is required." })
        if (!validation.isValidValue(password)) return res.status(400).send({ status: false, msg: "Password is required." })

        let getUser = await userModel.findOne({ email })
        if (!getUser) return res.status(404).send({ status: false, msg: "User not found!" })

        let matchPassword = await bcrypt.compare(password, getUser.password)
        if (!matchPassword) return res.status(401).send({ status: false, msg: "Password is incorrect." })

        //To create token
        let token = jwt.sign({
            userId: getUser._id,
            exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60
        }, "UrAnIuM#GrOuP@19");

        res.setHeader("x-api-key", token);
        return res.status(201).send({ status: true, msg: "User login sucessful", data: {userId:getUser._id, token:token } })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).send({ status: false, msg: "Error", error: err.message })
    }
}


module.exports = {
    createUser,loginUser
}