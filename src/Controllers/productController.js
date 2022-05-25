const productModel = require('../Models/productModel')
const { uploadFile } = require("../AWS_S3/awsUpload");

const {
    isValidRequestBody,
    isEmpty
} = require("../Utilites/validation");

const createProduct = async (req, res) => {
    try {
        let data = req.body;
        let productImage = req.files;
        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data
        if (isValidRequestBody(data))
            return res.status(400).send({ status: false, message: "Form data cannot be empty" });
        if (productImage.length == 0)
            return res.status(400).send({ status: false, message: "upload product image" });
        let uploadedFileURL = await uploadFile(productImage[0]);
        let obj = {
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            isFreeShipping,
            style,
            availableSizes,
            installments,
            productImage: uploadedFileURL
        }
        let result = await productModel.create(obj)
        res.status(201).send({ status: true, message: 'Success', data: result })
    }
    catch (e) {
        console.log(e.message);
        res.status(500).send({ status: false, message: e.message });
    }
}

//-----------Get Product-------------//
const getProduct = async (req, res) => {
    try {
        let userQuery = req.query

        let filter = { isDeleted: false }
        let { size, name, priceGreaterThan, priceLessThan } = userQuery

        if (!isEmpty(size)) {
            const sizeArray = size.trim().split(",").map((s) => s.trim());
            filter['availableSizes'] = { $all: sizeArray }
        }

        if (!isEmpty(name)) {
            filter['title'] = name
        }

        if (!isEmpty(priceGreaterThan)) {
            filter['price'] = { $gt: priceGreaterThan }
        }

        if (!isEmpty(priceLessThan)) {
            filter['price'] = { $lt: priceLessThan }
        }


        console.log(filter)
        let findBooks = await productModel.find(filter)
        if (findBooks.length === 0) return res.status(404).send({ status: false, message: "No products found" })
        res.status(200).send({ status: true, data: findBooks })

    } catch (e) {
        console.log(e.message);
        res.status(500).send({ status: false, message: e.message });
    }



}
const productByid = async  function(req,res){
 let productId =  req.params.productId
 //console.log(productId);
 let findBooks = await productModel.findOne({_id:productId,}).select({__v:0,createdAt:0,updatedAt:0})
 if(findBooks.isDeleted==true)  return res.status(400).send({ status: false, message: "product is deleted" })
 if (findBooks.length === 0) return res.status(404).send({ status: false, message: "No products found" })
 res.status(200).send({ status: true,message:"success", data: findBooks })
}


module.exports = { createProduct, getProduct,productByid}