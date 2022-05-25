const productModel = require('../Models/productModel')
const { uploadFile } = require("../AWS_S3/awsUpload");

const {
    isValidRequestBody,
    isEmpty,
    isValidObjectId,
    checkImage,
    stringCheck
} = require("../Utilites/validation");

const createProduct = async (req, res) => {
    try {
        let data = req.body;
        let productImage = req.files;
        // console.log(productImage[0].originalname)
        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data
        if (isValidRequestBody(data))
            return res.status(400).send({ status: false, message: "Form data cannot be empty" });
        if (productImage.length == 0)
            return res.status(400).send({ status: false, message: "upload product image" });
        if (productImage.length > 1)
            return res.status(400).send({ status: false, message: "only one image at a time" });
        if (!checkImage(productImage[0].originalname))
            return res.status(400).send({ status: false, message: "upload product image only" })
        if (isEmpty(title))
            return res.status(400).send({ status: false, message: "title required" });
        if (!stringCheck(title))
            return res.status(400).send({ status: false, message: "title invalid" });
        if (isEmpty(description))
            return res.status(400).send({ status: false, message: "description required" });
        if (!stringCheck(description))
            return res.status(400).send({ status: false, message: "description invalid" });
        if (isEmpty(price))
            return res.status(400).send({ status: false, message: "price required" });
        let pricenum = Number(price)
        let amount = pricenum.toFixed(3)
        //console.log(amount)
        if (isEmpty(currencyId))
            return res.status(400).send({ status: false, message: "currencyId required" });
        if (currencyId !== 'INR')
            return res.status(400).send({ status: false, message: "currencyId must be INR only" });
        if (isEmpty(currencyFormat))
            return res.status(400).send({ status: false, message: "currencyFormat required" });
        if (currencyFormat !== '₹')
            return res.status(400).send({ status: false, message: "currencyformat must be ₹ only" });
        if (isEmpty(availableSizes))
            return res.status(400).send({ status: false, message: "availableSizes required" });
        if (availableSizes) {
            let arr1 = ["S", "XS", "M", "X", "L", "XXL", "XL"]
            var arr2 = availableSizes.split(",")
            for (let i = 0; i < arr2.length; i++) {
                if (!arr1.includes(arr2[i])) {
                    return res.status(400).send({ status: false, message: "availableSizes must be [S, XS, M, X, L, XXL, XL]" });
                }
            }
        }

        //db call for title
        let unique = await productModel.findOne({ title: title })
        if (unique)
            return res.status(400).send({ status: false, message: "title already exists" });

        let uploadedFileURL = await uploadFile(productImage[0]);
        let obj = {
            title,
            description,
            price: amount,
            currencyId,
            currencyFormat,
            isFreeShipping,
            style,
            availableSizes:arr2,
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
        let { size, name, priceGreaterThan, priceLessThan, priceSort } = userQuery
        if (Object.keys(userQuery).length > 0) {
            if (!isEmpty(size)) {
                const sizeArray = size.trim().split(",").map((s) => s.trim());
                filter['availableSizes'] = { $all: sizeArray }
            }

            if (!isEmpty(name)) {
                filter['title'] = { $regex: name, $options: 'i' }
            }
            if (priceGreaterThan) {
                if (!isEmpty(priceGreaterThan)) {
                    filter['price'] = { $gt: priceGreaterThan }
                }
            }
            if (priceLessThan) {
                if (!isEmpty(priceLessThan)) {
                    filter['price'] = { $lt: priceLessThan }
                }
            }
            if (priceGreaterThan && priceLessThan) {
                filter['price'] = { $gte: priceGreaterThan, $lte: priceLessThan }
            }

            if (priceSort) {
                if (!isEmpty(priceSort)) {
                    if (!(priceSort == 1 || priceSort == -1))
                        return res.status(400).send({ status: false, message: "Price short value should be 1 or -1 only" })
                }
            }
        }
        let findBooks = await productModel.find(filter).sort({ price: priceSort })
        if (findBooks.length === 0) return res.status(404).send({ status: false, message: "No products found" })
        res.status(200).send({ status: true, data: findBooks })

    } catch (e) {
        console.log(e.message);
        res.status(500).send({ status: false, message: e.message });
    }



}

//===============================================[Get product byId]=================================================================

const productByid = async function (req, res) {
    try {
        let productId = req.params.productId
        //console.log(productId);
        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: "Invalid ProductId in params" });
        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) return res.status(404).send({ status: false, message: "No products found or product has been deleted" })
        res.status(200).send({ status: true, message: "success", data: product })
    }
    catch (e) {
        console.log(e.message);
        res.status(500).send({ status: false, message: e.message });
    }
}

//================================================[put:update product]===============================================================














module.exports = { createProduct, getProduct, productByid }