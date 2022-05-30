const cartModel = require('../Models/cartModel');
const productModel = require('../Models/productModel')
const userModel = require("../Models/userModel");
const orderModel = require("../Models/orderModel")
const { isValidRequestBody, isValidObjectId, isEmpty } = require("../Utilites/validation");


//--------------------------Create Order--------------------------------------------------------//
const createOrder = async(req,res)=>{
try{
    const userId = req.params.userId
    if(!isValidObjectId(userId))
    return res.status(400).send({ status: false, message: "Invalid userId ID" })
    
    const data = req.body
    if (isValidRequestBody(data)) 
    return res.status(400).send({ status: false, message: "Empty request body" });
    
    const {cartId} = data
    if(isEmpty(cartId))return res.status(400).send({ status: false, message: "cart ID required" })
    if(!isValidObjectId(cartId))
    return res.status(400).send({ status: false, message: "Invalid cart ID" })

    const findUser = await userModel.findOne({ _id: userId })
    if (!findUser) return res.status(404).send({ status: false, message: "User does not exists" })

    const tokenUserId = req.decodeToken.userId;
        if (tokenUserId !== findUser._id.toString())
            return res.status(403).send({ status: false, message: "Unauthorized access" });
    
    const findCart = await cartModel.findOne({ _id: cartId })
    if (!findCart) return res.status(404).send({ status: false, message: "No cart found" })
    if(findCart.items.length === 0 ) return res.status(400).send({status:false, message:"No Items in cart"})
            
    let totalQ = 0 
    let cartItems = findCart.items
    for (let i = 0; i < cartItems.length; i++) {
        totalQ +=cartItems[i].quantity
    }
        
    const orderDetails ={}
    orderDetails['userId'] = userId
    orderDetails['items'] =findCart.items
    orderDetails['totalPrice'] =findCart.totalPrice
    orderDetails['totalItems'] = findCart.items.length
    orderDetails['totalQuantity'] =totalQ

    //Change in cart model
    findCart.items =[]
    findCart.totalItems = 0
    findCart.totalPrice = 0
    
    await findCart.save()
    const getOrder = await orderModel.create(orderDetails)
    
    let obj={
        userId: getOrder.userId,
        items:getOrder.items,
        totalPrice: getOrder.totalPrice,
        totalItems: getOrder.totalItems,
        totalQuantity:getOrder.totalQuantity,
        cancellable: true,
        status: "pending",
        _id: getOrder._id,
        createdAt: getOrder.createdAt,
         updatedAt: getOrder.updatedAt
    }
    return res.status(201).send({status:true, message:"Order Placed Success", data:obj})

}catch (err) {
        return res.status(500).send({ err: err.message });
    }
    
}

module.exports={createOrder}

