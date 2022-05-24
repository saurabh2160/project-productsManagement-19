const userModel = require('../Models/userModel')
const { uploadFile } = require('../AWS_S3/awsUpload')
const {
    isValidRequestBody,
    isEmpty,
    isValidEmail,
    isValidPhone,
    isValidPassword,
    isValidObjectId, } = require('../Utilites/validation')

const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const saltRounds = 10

const createUser = async (req, res) => {
    try {
        let data = req.body
        let profileImage = req.files
        let { fname, lname, email, phone, password, address } = data
        let add = JSON.parse(address)
        //console.log(profileImage)
        if (isValidRequestBody(data)) return res.status(400).send({ status: false, message: "Form data cannot be empty" })
        if (profileImage.length == 0) return res.status(400).send({ status: false, message: "upload profile image" })
        if (isEmpty(fname)) return res.status(400).send({ status: false, message: "fname required" })
        if (isEmpty(lname)) return res.status(400).send({ status: false, message: "lname required" })
        if (isEmpty(email)) return res.status(400).send({ status: false, message: "email required" })
        if (isEmpty(password)) return res.status(400).send({ status: false, message: "password required" })
        if (!isValidPassword(password)) return res.status(400).send({ status: false, message: "password invalid" })
        if (isEmpty(phone)) return res.status(400).send({ status: false, message: "phone required" })
        if (isEmpty(address)) return res.status(400).send({ status: false, message: "address required" })
        if (isEmpty(add.shipping)) return res.status(400).send({ status: false, message: "shipping address required" })
        if (isEmpty(add.billing)) return res.status(400).send({ status: false, message: "billing address required" })
        if (isEmpty(add.shipping.city)) return res.status(400).send({ status: false, message: "shipping city required" })
        if (isEmpty(add.shipping.street)) return res.status(400).send({ status: false, message: "shipping street required" })
        if (isEmpty(add.shipping.pincode)) return res.status(400).send({ status: false, message: "shipping pincode required" })
        // if (typeof add.shipping.pincode !== 'number' && add.shipping.pincode.length !== 6)
        //     return res.status(400).send({ status: false, message: "shipping pincode invalid" })
        if (isEmpty(add.billing.street)) return res.status(400).send({ status: false, message: "shipping street required" })
        if (isEmpty(add.billing.city)) return res.status(400).send({ status: false, message: "billing city required" })
        if (isEmpty(add.billing.pincode)) return res.status(400).send({ status: false, message: "billing pincode required" })
        // if (typeof add.billing.pincode !== 'number')
        //     return res.status(400).send({ status: false, message: "billing pincode invalid" })

        if (!fname.match(/^[#.a-zA-Z\s,-]+$/)) return res.status(400).send({ status: false, message: "enter valid fname" })
        if (!lname.match(/^[#.a-zA-Z\s,-]+$/)) return res.status(400).send({ status: false, message: "enter valid lname" })
        if (!isValidEmail(email)) return res.status(400).send({ status: false, message: "enter valid email" })
        if (!isValidPhone(phone)) return res.status(400).send({ status: false, message: "enter valid phone" })
        let phoneCheck = await userModel.findOne({ phone: phone })
        if (phoneCheck) {
            if (phoneCheck.phone == phone) return res.status(400).send({ status: false, message: "phone number already exist" })
        }
        let emailCheck = await userModel.findOne({ email: email })
        if (emailCheck) {
            if (emailCheck.email == email) return res.status(400).send({ status: false, message: "email already exist" })
        }
        const salt = await bcrypt.genSalt(saltRounds)
        const hashPassword = await bcrypt.hash(password, salt)
        //console.log(hashPassword)
        let uploadedFileURL = await uploadFile(file[0])
        let obj = {
            fname,
            lname,
            email,
            profileImage: uploadedFileURL,
            phone,
            password: hashPassword,
            address: JSON.parse(address)
        }
        const result = await userModel.create(obj)
        res.status(201).send({ status: true, data: result })
    }
    catch (e) {
        console.log(e.message)
        res.status(500).send({ status: false, message: e.message })
    }
}



//----Login
const loginUser = async function (req, res) {
    try {
        let data = req.body
        let { email, password } = data
        if (isValidRequestBody(data)) return res.status(400).send({ status: false, message: "No input by user" })
        if (isEmpty(email)) return res.status(400).send({ status: false, msg: "email is required." })
        if (isEmpty(password)) return res.status(400).send({ status: false, msg: "Password is required." })

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
        return res.status(201).send({ status: true, msg: "User login sucessful", data: { userId: getUser._id, token: token } })
    }
    catch (err) {
        console.log(err.message)
        return res.status(500).send({ status: false, msg: "Error", error: err.message })
    }
}
//====================================================[GET USER BY ID]====================================================

const getUserProfile = async function (req, res) {
    try {
        const userId = req.params.userId
        const tokenUserId = req.decodeToken.userId
        // console.log(tokenUserId +" )

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: 'Invalid userId in params' })
        }

        const userProfile = await userModel.findOne({ _id: userId })
        console.log(userProfile)
        if (!userProfile) {
            return res.status(400).send({ status: false, message: "User doesn't exits" })
        }
        if (tokenUserId !== userProfile._id.toString()) {
            return res.status(403).send({ status: false, message: 'Unauthorized access' })
        }
        return res.status(200).send({ status: true, message: 'Profile successfully found', data: userProfile })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

///===================================================[USER UPDATE API ]====================================================
const updateUser = async function (req, res) {
    try {
        let data=req.body
        let { fname, lname, email, profileImage, phone, password } = data;
        const userId = req.params.userId;
        const tokenUserId=req.decodeToken.userId
        if (fname) {
            if (!(isValid(fname))) {
                return res.status(400).send({ status: false, msg: "fname is not valid " })
            }
        }
        if (lname) {
            if (!(isValid(lname))) {
                return res.status(400).send({ status: false, msg: "lname is not valid " })
            }
        }
        if (email) {
            if (!emailRegex.test(email)) {
                return res.status(400).send({ status: false, msg: "email  is not valid " })
            }
            let uniqueEmail = await userModel.findOne({ email: email })
            if (uniqueEmail) return res.status(400).send({ status: false, msg: " email is already exists" })

        }
        if (profileImage) {

        }
        if (phone) {
            if (!mobileNumberRegex.test(phone)) {
                return res.status(400).send({ status: false, msg: " phone no  is not valid " })
            }
            let uniquePhoneNumber = await userModel.findOne({ phone: phone })
            if (uniquePhoneNumber) return res.status(400).send({ status: false, msg: " phone no  is already exists" })
        }
        if (password) {


        }
        let updateUser = await userModel.findByIdAndUpdate({ _id: userId }, {
            $set: {
                fname: fname, lname: lname, email: email, profileImage: profileImage, phone: phone, password: password
            }
        }, { new: true })

        if (updateUser == null) {
            return res.status(404).send({ status: false, msg: "This book is not available" })
        }
        res.status(200).send({ status: true, data: updateUser })

    }
    catch (err) {
        return res.status(500).send({ err: err.message })

    }
}
module.exports = {
    createUser, loginUser, getUserProfile
}