const cartModel = require('../Models/cartModel');
const productModel = require('../Models/productModel')
const userModel = require("../Models/userModel");

//const ObjectId = mongoose.Schema.Types.ObjectId

//--Create Cart--//
const createCart = async (req, res) => {
    try {
        let data = req.body;
        let userId = req.params.userId
        const tokenUserId = req.decodeToken.userId;
        let { productId, cartId, quantity } = data
        let validUser = await userModel.findOne({ _id: userId })
        //console.log(validUser)
        if (!validUser)
            return res.status(404).send({ status: false, message: "User does not exists" })
        if (validUser._id.toString() !== tokenUserId)
            return res.status(403).send({ status: false, message: "Unauthorized access" });

        let validProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!validProduct)
            return res.status(404).send({ status: false, message: "No products found or product has been deleted" })
        let validCart = await cartModel.findOne({ userId: userId })
        let calprice = validProduct.price * Number(quantity)
        let obj = {
            userId: userId,
            items: [{
                productId: productId,
                quantity: quantity
            }],
            totalPrice: calprice,
        }
        obj['totalItems'] = obj.items.length
        if (!validCart) {
            let cart = await cartModel.create(obj)
            console.log(cart)
            return res.send({ data: cart })
        }
    }
    catch (err) {
        return res.status(500).send({ err: err.message });
    }
}

module.exports = { createCart }