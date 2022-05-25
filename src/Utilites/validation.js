const mongoose = require("mongoose")


let isValidRequestBody = function (body) {
    if (Object.keys(body).length === 0) return true;
    return false;
}

let isEmpty = function (value) {
    if (typeof value === 'undefined' || value === null) return true;
    if (typeof value === 'string' && value.trim().length === 0) return true;

    return false;
}

let isValidPhone = function (number) {
    let phoneRegex = /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/;
    return phoneRegex.test(number);
}

let isValidEmail = function (email) {
    let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    return emailRegex.test(email)
}

let isValidPassword = function (password) {
    let passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,15}$/
    return passwordRegex.test(password)
}

let isValidObjectId = function (ObjectId) {
    return mongoose.isValidObjectId(ObjectId)
}
let checkPincode = (pincode) => {
    let pincoderegex = /^[0-9]{2}$/
    return pincoderegex.test(pincode)
}
let checkImage = (img) => {
    let imageRegex = /(jpeg|png|jpg)$/
    return imageRegex.test(img)
}
let stringCheck = (string) => {
    let stringreg = /^[#.a-zA-Z0-9\s,-]+$/
    return stringreg.test(string)
}


module.exports = {
    isValidRequestBody,
    isEmpty,
    isValidEmail,
    isValidPhone,
    isValidPassword,
    isValidObjectId,
    checkPincode,
    checkImage,
    stringCheck
}