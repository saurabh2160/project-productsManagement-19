const express = require("express");
const router = express.Router()
const mid = require('../Middlewares/auth')

const userController = require('../Controllers/userController')
const productController = require('../Controllers/productController')
// const cartController = require('../Controllers/cartController')
// const orderController = require('../Controllers/orderController')

//user routes
router.post('/register', userController.createUser)
router.post('/login', userController.loginUser)
router.get('/user/:userId/profile', mid.mid1, userController.getUserProfile)
router.put('/user/:userId/profile', mid.mid1, userController.updateUser)


//product api
router.post('/products', productController.createProduct)
router.get('/products', productController.getProduct)
router.get('/products/:productId', productController.productByid)






















// router.post('/checktoken',mid.mid1,(req,res)=>{
//     let token =req.headers.authorization
//     console.log(token.split(' '))
//     res.send("i in")
// })






module.exports = router