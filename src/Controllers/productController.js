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
        let obj={
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            isFreeShipping,
            style,
            availableSizes,
            installments,
            productImage:uploadedFileURL
        }
        let result=await productModel.create(obj)
        res.status(201).send({status:true,message: 'Success',data:result})
    }
    catch (e) {
        console.log(e.message);
        res.status(500).send({ status: false, message: e.message });
    }
}

module.exports={createProduct}