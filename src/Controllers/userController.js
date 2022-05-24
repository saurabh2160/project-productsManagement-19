const userModel = require("../Models/userModel")
const  mobileNumberRegex = /^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/;
const  emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

const isValid = function (value) {
    if (typeof value === "undefined" || value === null ) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

const updateUser = async function (req, res) {
    try {
        let { fname, lname, email, profileImage, phone, password } = req.data;
        const userId = req.params.userId;
        if (fname) {
          if(!(isValid(fname))){
            return res.status(400).send({ status: false, msg: "fname is not valid " })  
          }
        }
        if (lname) {
            if(!(isValid(lname))){
                return res.status(400).send({ status: false, msg: "lname is not valid " })  
              }
        }
        if (email) {
            if (!emailRegex.test(email)){
                return res.status(400).send({ status: false, msg: "email  is not valid " })  
            }
            let uniqueEmail = await userModel.findOne({ email:email })                                                     
            if (uniqueEmail) return res.status(400).send({ status: false, msg: " email is already exists" })

        }
        if (profileImage) {

        }
        if (phone) {
            if(!mobileNumberRegex.test(phone)){
                return res.status(400).send({ status: false, msg: " phone no  is not valid " })
            }
            let uniquePhoneNumber = await userModel.findOne({phone:phone })                                                       
            if (uniquePhoneNumber) return res.status(400).send({ status: false, msg: " phone no  is already exists" })
        }
        if (password) {


        }
      let updateBook  =  findByIdAndUpdate({_id: userId},{
          


      })
    }
    catch (err) {
        return res.status(500).send({ err: err.message })

    }
}
module.exports = { updateUser }