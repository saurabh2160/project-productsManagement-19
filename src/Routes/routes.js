const express = require("express");
const router = express.Router()

const userController = require('../Controllers/userController')
// const productController = require('../Controllers/productController')
// const cartController = require('../Controllers/cartController')
// const orderController = require('../Controllers/orderController')


router.post('/register',userController.createUser)





module.exports = router