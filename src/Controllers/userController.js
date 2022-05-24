const userModel = require("../Models/userModel")
const { uploadFile } = require('../AWS_S3/awsUpload')
const mobileNumberRegex = /^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/;
const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

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

const updateUser = async function (req, res) {
    try {
        let { fname, lname, email, profileImage, phone, password } = req.data;
        const userId = req.params.userId;
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
module.exports = { updateUser, createUser }
