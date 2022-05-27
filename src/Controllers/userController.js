const userModel = require("../Models/userModel");
const { uploadFile } = require("../AWS_S3/awsUpload");
const {
    isValidRequestBody,
    isEmpty,
    isValidEmail,
    isValidPhone,
    isValidPassword,
    isValidObjectId,
    checkPincode,
    anyObjectKeysEmpty,
    checkImage
} = require("../Utilites/validation");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const createUser = async (req, res) => {
    try {
        let data = JSON.parse(JSON.stringify(req.body));;
        let profileImage = req.files;
        let { fname, lname, email, phone, password, address } = data;
        if (isValidRequestBody(data))
            return res
                .status(400)
                .send({ status: false, message: "Form data cannot be empty" });
        // if (profileImage.length == 0)
        //     return res.status(400).send({ status: false, message: "upload profile image" });
        if (isEmpty(fname))
            return res.status(400).send({ status: false, message: "fname required" });
        if (isEmpty(lname))
            return res.status(400).send({ status: false, message: "lname required" });
        if (isEmpty(email))
            return res.status(400).send({ status: false, message: "email required" });
        if (isEmpty(password))
            return res.status(400).send({ status: false, message: "password required" });
        if (!isValidPassword(password))
            return res.status(400).send({ status: false, message: "password invalid" });
        if (isEmpty(phone))
            return res.status(400).send({ status: false, message: "phone required" });
        if (isEmpty(address))
            return res.status(400).send({ status: false, message: "address required" });
        let add = JSON.parse(address);
        if (isEmpty(add.shipping))
            return res.status(400).send({ status: false, message: "shipping address required" });
        if (isEmpty(add.billing))
            return res.status(400).send({ status: false, message: "billing address required" });
        if (isEmpty(add.shipping.city))
            return res.status(400).send({ status: false, message: "shipping city required" });
        if (isEmpty(add.shipping.street))
            return res.status(400).send({ status: false, message: "shipping street required" });
        if (isEmpty(add.shipping.pincode))
            return res.status(400).send({ status: false, message: "shipping pincode required" });

        if (!checkPincode(add.shipping.pincode))
            return res.status(400).send({ status: false, message: "shipping pincode invalid" });
        if (isEmpty(add.billing.street))
            return res.status(400).send({ status: false, message: "shipping street required" });
        if (isEmpty(add.billing.city))
            return res.status(400).send({ status: false, message: "billing city required" });
        if (isEmpty(add.billing.pincode))
            return res.status(400).send({ status: false, message: "billing pincode required" });
        if (!checkPincode(add.billing.pincode))
            return res.status(400).send({ status: false, message: "billing pincode invalid" })

        if (!fname.match(/^[#.a-zA-Z\s,-]+$/))
            return res.status(400).send({ status: false, message: "enter valid fname" });
        if (!lname.match(/^[#.a-zA-Z\s,-]+$/))
            return res.status(400).send({ status: false, message: "enter valid lname" });
        if (!isValidEmail(email))
            return res.status(400).send({ status: false, message: "enter valid email" });
        if (!isValidPhone(phone))
            return res.status(400).send({ status: false, message: "enter valid phone" });
        //DB calls for phone and email
        let phoneCheck = await userModel.findOne({ phone: phone });
        if (phoneCheck)
            return res
                .status(400)
                .send({ status: false, message: "phone number already exist" });
        let emailCheck = await userModel.findOne({ email: email });
        if (emailCheck)
            return res
                .status(400)
                .send({ status: false, message: "email already exist" });

        //passowrd bcrypt
        const salt = await bcrypt.genSalt(saltRounds);
        const hashPassword = await bcrypt.hash(password, salt);
        //console.log(hashPassword)
        if (profileImage.length == 0)
            return res.status(400).send({ status: false, message: "upload profile image" });
        if (profileImage.length > 1)
            return res.status(400).send({ status: false, message: "only one image at a time" });
        if (!checkImage(profileImage[0].originalname))
            return res.status(400).send({ status: false, message: "format must be jpeg/jpg/png only" })
        let uploadedFileURL = await uploadFile(profileImage[0]);
        let obj = {
            fname,
            lname,
            email,
            profileImage: uploadedFileURL,
            phone,
            password: hashPassword,
            address: JSON.parse(address),
        };
        const result = await userModel.create(obj);
        res.status(201).send({ status: true, data: result });
    } catch (e) {
        console.log(e.message);
        res.status(500).send({ status: false, message: e.message });
    }
};
 


//----Login
const loginUser = async function (req, res) {
    try {
        let data = JSON.parse(JSON.stringify(req.body));
        let { email, password } = data;
        if (isValidRequestBody(data))
            return res
                .status(400)
                .send({ status: false, message: "No input by user" });
        if (isEmpty(email))
            return res.status(400).send({ status: false, msg: "email is required." });
        if (isEmpty(password))
            return res
                .status(400)
                .send({ status: false, msg: "Password is required." });

        let getUser = await userModel.findOne({ email });
        if (!getUser)
            return res.status(404).send({ status: false, msg: "User not found!" });

        let matchPassword = await bcrypt.compare(password, getUser.password);
        if (!matchPassword)
            return res
                .status(401)
                .send({ status: false, msg: "Password is incorrect." });

        //To create token
        let token = jwt.sign(
            {
                userId: getUser._id,
                exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
            },
            "UrAnIuM#GrOuP@19"
        );

        res.setHeader("x-api-key", token);
        return res
            .status(200)
            .send({
                status: true,
                msg: "User login sucessful",
                data: { userId: getUser._id, token: token },
            });
    } catch (err) {
        console.log(err.message);
        return res
            .status(500)
            .send({ status: false, msg: "Error", error: err.message });
    }
};



//====================================================[GET USER BY ID]====================================================

const getUserProfile = async function (req, res) {
    try {
        const userId = req.params.userId;
        const tokenUserId = req.decodeToken.userId;
        // console.log(tokenUserId +" )

        if (!isValidObjectId(userId)) {
            return res
                .status(400)
                .send({ status: false, message: "Invalid userId in params" });
        }

        const userProfile = await userModel.findOne({ _id: userId });
        // console.log(userProfile);
        // console.log(userProfile._id.toString());
        // console.log(userProfile._id);
        // console.log(tokenUserId);
        if (!userProfile) {
            return res
                .status(400)
                .send({ status: false, message: "User doesn't exits" });
        }
        if (tokenUserId !== userProfile._id.toString()) {
            return res
                .status(403)
                .send({ status: false, message: "Unauthorized access" });
        }
        return res
            .status(200)
            .send({
                status: true,
                message: "Profile successfully found",
                data: userProfile,
            });
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};

///===================================================[USER UPDATE API ]====================================================
const updateUser = async function (req, res) {
    try {
        let data = JSON.parse(JSON.stringify(req.body));
        let checkdata = anyObjectKeysEmpty(data)
        if (checkdata) return res.status(400).send({ status: false, message: `${checkdata} can't be empty` });
        let { fname, lname, email, phone, password, address } = data;
        const userId = req.params.userId;
        const profileImage = req.files;
        const tokenUserId = req.decodeToken.userId;
        if (isValidRequestBody(data)) return res.status(400).send({ status: false, message: "enter data for update" });
        let userProfile = await userModel.findOne({ _id: userId });
        //console.log(userProfile.address.shipping.street)
        if (userProfile._id.toString() !== tokenUserId)
            return res.status(403).send({ status: false, message: "Unauthorized access" });
        // validation for empty fname and lname
        if (!isEmpty(fname)) {
            if (!fname.match(/^[#.a-zA-Z\s,-]+$/))
                return res.status(400).send({ status: false, message: "enter valid fname" });
            userProfile.fname = fname;
        }
        if (!isEmpty(lname)) {
            if (!fname.match(/^[#.a-zA-Z\s,-]+$/))
                return res.status(400).send({ status: false, message: "enter valid fname" });
            userProfile.lname = lname;
        }
        if (!isEmpty(email)) {
            if (!isValidEmail(email))
                return res.status(400).send({ status: false, message: "enter valid email" });
            let uniqueEmail = await userModel.findOne({ email: email });
            if (uniqueEmail)
                return res.status(400).send({ status: false, msg: " email is already exists" });
            userProfile.email = email;
        }
        if (!isEmpty(phone)) {
            if (!isValidPhone(phone))
                return res.status(400).send({ status: false, msg: " phone num is not valid " });
            let phoneCheck = await userModel.findOne({ phone: phone });
            if (phoneCheck)
                return res.status(400).send({ status: false, message: "phone number already exist" });
            userProfile.phone = phone;
        }
        if (!isEmpty(password)) {
            if (!isValidPassword(password))
                return res.status(400).send({ status: false, message: "password invalid" });
            const salt = await bcrypt.genSalt(saltRounds);
            const hashPassword = await bcrypt.hash(password, salt);
            userProfile.password = hashPassword;
        }
        if (profileImage) {
            if (profileImage.length > 1)
                return res.status(400).send({ status: false, message: "only one image at a time" });
            if (!checkImage(profileImage[0].originalname))
                return res.status(400).send({ status: false, message: "format must be jpeg/jpg/png only" })
            let uploadedFileURL = await uploadFile(profileImage[0]);
            userProfile.profileImage = uploadedFileURL;
        }
        if (!isEmpty(address)) {
            let add = JSON.parse(address)
            if (add.shipping) {
                if (add.shipping.street) {
                    userProfile.address.shipping.street = add.shipping.street
                } if (add.shipping.city) {
                    userProfile.address.shipping.city = add.shipping.city
                } if (add.shipping.pincode) {
                    if (!checkPincode(add.shipping.pincode))
                        return res.status(400).send({ status: false, message: "shipping pincode invalid" });
                    userProfile.address.shipping.pincode = add.shipping.pincode
                }
            }
            if (add.billing) {
                if (add.billing.street) {
                    userProfile.address.billing.street = add.billing.street
                } if (add.billing.city) {
                    userProfile.address.billing.city = add.billing.city
                } if (add.billing.pincode) {
                    if (!checkPincode(add.billing.pincode))
                        return res.status(400).send({ status: false, message: "billing pincode invalid" })
                    userProfile.address.billing.pincode = add.billing.pincode
                }
            }
        }
        await userProfile.save();
        res.status(200).send({
            status: true,
            message: "User profile updated",
            data: userProfile,
        });
    } catch (err) {
        return res.status(500).send({ err: err.message });
    }
};
module.exports = {
    createUser,
    loginUser,
    getUserProfile,
    updateUser,
};
