const express = require("express");
const router = express.Router()
const mid=require('../Middlewares/auth')

const userController = require('../Controllers/userController')
// const productController = require('../Controllers/productController')
// const cartController = require('../Controllers/cartController')
// const orderController = require('../Controllers/orderController')

//user routes
router.post('/register',userController.createUser)
router.post('/login',userController.loginUser)





















// router.post('/checktoken',mid.mid1,(req,res)=>{
//     let token =req.headers.authorization
//     console.log(token.split(' '))
//     res.send("i in")
// })






module.exports = router