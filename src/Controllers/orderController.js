const orderModel = require("../Models/orderModel");
const cartModel = require('../Models/cartModel');
const productModel = require('../Models/productModel')
const userModel = require("../Models/userModel");
const {
    isValidRequestBody,
    isEmpty,
    isValidObjectId
} = require("../Utilites/validation");
const createOrder = async (req, res) => {
    try {
        let data = JSON.parse(JSON.stringify(req.body));
        if (isValidRequestBody(data))
            return res.status(400).send({ status: false, message: "Body cannot be empty" });
        let userId = req.params.userId
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: "Invalid userId ID" })

        //getting token from req in auth    
        const tokenUserId = req.decodeToken.userId;
        let cartId = data.cartId
        if (cartId) {
            if (!isValidObjectId(cartId))
                return res.status(400).send({ status: false, message: "Invalid cart ID" })
        }
        // user validation
        let validUser = await userModel.findOne({ _id: userId })
        if (!validUser)
            return res.status(404).send({ status: false, message: "User does not exists" })
        // user authorization    
        if (validUser._id.toString() !== tokenUserId)
            return res.status(403).send({ status: false, message: "Unauthorized access" })
        // srching for cart
        let validCart = await cartModel.findOne({ userId: userId })
        if (validCart) {
            if (cartId) {
                if (validCart._id != cartId)
                    return res.status(400).send({ status: false, message: `Cart does not belong to ${validUser.fname} ${validUser.lname}` })
            }
        }
        let itemsarr = validCart.items
        let count = 0
        for (let i = 0; i < itemsarr.length; i++) {
           
           count += itemsarr[i].quantity
        }
        //let length = validCart.items
        let obj = {
            userId: userId,
            items: validCart.items,
            totalPrice:validCart.totalPrice,
            totalItems: validCart.items.length ,
          //  isDeleted:false,
            totalQuantity:count
        }
        // let length = validCart.items.quantity
       // console.log(length);
     // obj['totalQuantity'] = validCart.items.
        let result = await orderModel.create(obj)
        console.log(obj)
       return res.send({ status: true, message: 'Success', data: result })
    } catch (err) {
        return res.status(500).send({ err: err.message });
    }
}
module.exports = { createOrder }

