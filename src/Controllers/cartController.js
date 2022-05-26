const cartModel = require('../Models/cartModel');
const productModel = require('../Models/productModel')
const userModel = require("../Models/userModel");
const {
    isValidRequestBody,
    isEmpty,
    isValidObjectId,
    checkImage,
    stringCheck,
    anyObjectKeysEmpty,

} = require("../Utilites/validation");

//const ObjectId = mongoose.Schema.Types.ObjectId

//--Create Cart--//
const createCart = async (req, res) => {
    try {
        let data = JSON.parse(JSON.stringify(req.body));
        if (isValidRequestBody(data))
            return res.status(400).send({ status: false, message: "Body cannot be empty" });
        let userId = req.params.userId
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: "Invalid userId ID" })

        //getting token from req in auth    
        const tokenUserId = req.decodeToken.userId;
        let { productId, cartId, quantity } = data
        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: "Invalid product ID" })

        //checking for valid user
        let validUser = await userModel.findOne({ _id: userId })
        if (!validUser)
            return res.status(404).send({ status: false, message: "User does not exists" })
        // user authorization    
        if (validUser._id.toString() !== tokenUserId)
            return res.status(403).send({ status: false, message: "Unauthorized access" });

        //searching for product    
        let validProduct = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!validProduct)
            return res.status(404).send({ status: false, message: "No products found or product has been deleted" })


        //if user already has cart
        if (cartId) {
            if (!isValidObjectId(cartId))
                return res.status(400).send({ status: false, message: "Invalid cart ID" })
            let cartfind = await cartModel.findOne({ _id: cartId })
            if (!cartfind)
                return res.status(404).send({ status: false, message: "No cart found" })
            //update cart 
            cartfind.items.push({ productId: productId, quantity: Number(quantity) })
            let total = cartfind.totalPrice + (validProduct.price * Number(quantity))
            cartfind.totalPrice = total
            let count = cartfind.totalItems
            cartfind.totalItems = count + 1
            await cartfind.save()
            let result = await cartModel.findOne({ _id: cartId }).select({ "items._id": 0, __v: 0 })
            return res.send({ status: true, data: result })
        }
        // 1st time cart
        let validCart = await cartModel.findOne({ userId: userId })
        if (validCart) return res.status(404).send({ status: false, message: "Cart for the user already exists plz enter cart id" })
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
            await cartModel.create(obj)
            //console.log(cart)
            let result = await cartModel.findOne({ userId: userId }).select({ "items._id": 0, __v: 0 })
            return res.send({ data: result })
        }
    }
    catch (err) {
        return res.status(500).send({ err: err.message });
    }
}
//========================================================[UPDATE CART]===========================================================
const updateCart=async(req,res)=>{

}
//========================================================[GET CART]===============================================================

const getCart = async (req, res) => {
    try {
        let userId = req.params.userId
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: "Invalid userId ID" })
        const tokenUserId = req.decodeToken.userId;
        let validUser = await userModel.findOne({ _id: userId })
        if (!validUser)
            return res.status(404).send({ status: false, message: "User does not exists" })
        // user authorization    
        if (validUser._id.toString() !== tokenUserId)
            return res.status(403).send({ status: false, message: "Unauthorized access" });
        let validCart = await cartModel.findOne({ userId: userId }).select({ "items._id": 0, __v: 0 })
        if (!validCart)
            return res.status(404).send({ status: false, message: "No cart found" })
        res.status(200).send({ status: true, message: 'Success', Data: validCart })
    }
    catch (err) {
        return res.status(500).send({ err: err.message });
    }
}
//========================================================[DELETE  CART]===============================================================

const deleteCart = async (req, res) => {
    try {
        let userId = req.params.userId
        if (!isValidObjectId(userId))
            return res.status(400).send({ status: false, message: "Invalid userId ID" })
        const tokenUserId = req.decodeToken.userId;
        let validUser = await userModel.findOne({ _id: userId })
        if (!validUser)
            return res.status(404).send({ status: false, message: "User does not exists" })
        if (validUser._id.toString() !== tokenUserId)
            return res.status(403).send({ status: false, message: "Unauthorized access" });
        let validCart = await cartModel.findOne({ userId: userId }).select({  __v: 0 })
        if (!validCart)
            return res.status(404).send({ status: false, message: "No cart found" })
        let empty = []
        validCart.items = empty
        validCart.totalPrice = 0;
        validCart.totalItems = 0;
        await validCart.save();
        res.send({ status: true, message: 'Success', Data: validCart })
    }
    catch (err) {
        return res.status(500).send({ err: err.message });
    }
}
module.exports = { createCart, getCart,updateCart,deleteCart }