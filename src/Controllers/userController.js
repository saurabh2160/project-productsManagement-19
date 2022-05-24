const userModel = require('../Models/userModel')
const { uploadFile } = require('../AWS_S3/awsUpload')

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

module.exports = {
    createUser
}