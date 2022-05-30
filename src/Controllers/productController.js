const productModel = require('../Models/productModel')
const { uploadFile } = require("../AWS_S3/awsUpload");

const {
    isValidRequestBody,
    isEmpty,
    isValidObjectId,
    checkImage,
    stringCheck,
    numCheck,
    anyObjectKeysEmpty,

} = require("../Utilites/validation");

const createProduct = async (req, res) => {
    try {
        let data = JSON.parse(JSON.stringify(req.body));;
        let productImage = req.files;
        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data
        if (isValidRequestBody(data))
            return res.status(400).send({ status: false, message: "Form data cannot be empty" });
        if (productImage.length == 0)
            return res.status(400).send({ status: false, message: "upload product image" });
        if (productImage.length > 1)
            return res.status(400).send({ status: false, message: "only one image at a time" });
        if (!checkImage(productImage[0].originalname))
            return res.status(400).send({ status: false, message: "format must be jpeg/jpg/png only" })
        if (isEmpty(title))
            return res.status(400).send({ status: false, message: "title required" });
        if (!stringCheck(title))
            return res.status(400).send({ status: false, message: "title invalid" });
        if (isEmpty(description))
            return res.status(400).send({ status: false, message: "description required" });
        // if (!stringCheck(description))
        //     return res.status(400).send({ status: false, message: "description invalid" });
        if (isEmpty(price))
            return res.status(400).send({ status: false, message: "price required" });
        if (!price.match(/^\d{0,8}(\.\d{1,4})?$/))
            return res.status(400).send({ status: false, message: "price invalid" })
        if (!installments.match(/^[0-9]{1,2}$/))
            return res.status(400).send({ status: false, message: "installment invalid" });
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
            var arr2 = availableSizes.toUpperCase().split(",").map((s) => s.trim())
            for (let i = 0; i < arr2.length; i++) {
                if (!arr1.includes(arr2[i])) {
                    return res.status(400).send({ status: false, message: "availableSizes must be [S, XS, M, X, L, XXL, XL]" });
                }
            }
        }

        //db call for title
        let uniqueTitle = await productModel.findOne({ title: { $regex: title, $options: "i" } })
        if (uniqueTitle) {
            if (uniqueTitle.title.toUpperCase() == title.toUpperCase()) {
                return res.status(400).send({ status: false, message: "title is already exsits" })
            }
        }

        let uploadedFileURL = await uploadFile(productImage[0]);
        let obj = {
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            isFreeShipping,
            style,
            availableSizes: arr2,
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
        let checkquery = anyObjectKeysEmpty(userQuery)
        if (checkquery) return res.status(400).send({ status: false, message: `${checkquery} can't be empty` });
        let filter = { isDeleted: false }
        let { size, name, priceGreaterThan, priceLessThan, priceSort } = userQuery


        if (Object.keys(userQuery).length > 0) {
            if (!isEmpty(size)) {
                const sizeArray = size.trim().split(",").map((s) => s.trim());
                filter['availableSizes'] = { $all: sizeArray }
            }
            if (!isEmpty(name)) {
                filter['title'] = { $regex: name, $options: 'i' }
                console.log(filter)
            }
            if (priceGreaterThan) {
                if (isEmpty(priceGreaterThan) || !numCheck(priceGreaterThan)) {
                    return res.status(400).send({ status: false, message: "not valid price" })
                }
                filter['price'] = { $gt: priceGreaterThan }

            }
            if (priceLessThan) {
                if (isEmpty(priceLessThan) || !numCheck(priceLessThan)) {
                    return res.status(400).send({ status: false, message: "not valid price" })
                }
                filter['price'] = { $lt: priceLessThan }
            }

            if (priceGreaterThan && priceLessThan) {
                filter['price'] = { $gte: priceGreaterThan, $lte: priceLessThan }
                console.log(filter)
            }

            if (priceSort) {
                if (!isEmpty(priceSort)) {
                    if (!(priceSort == 1 || priceSort == -1))
                        return res.status(400).send({ status: false, message: "Price short value should be 1 or -1 only" })
                    console.log(filter)
                }
            }
        }


        let product = await productModel.find(filter).sort({ price: priceSort }).collation({ locale: "en", strength: 2 });
        if (product.length === 0) return res.status(404).send({ status: false, message: "No products found" })
        res.status(200).send({ status: true, data: product })

    } catch (e) {
        console.log(e.message);
        res.status(500).send({ status: false, message: e.message });
    }
}

//===============================================[Get product byId]=================================================================

const productByid = async function (req, res) {
    try {
        let productId = req.params.productId
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

const updateProduct = async (req, res) => {
    try {

        let data = JSON.parse(JSON.stringify(req.body));

        let checkObj = anyObjectKeysEmpty(data)
        if (checkObj) return res.status(400).send({ status: false, message: `${checkObj} can't be empty` });

        const productId = req.params.productId
        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, isDeleted, deletedAt } = data

        const productImage = req.files;
        
        if (isValidRequestBody(data) && typeof productImage === 'undefined')
            return res.status(400).send({ status: false, message: "enter data for update" });

        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: "Invalid ProductId in params" });
        if (isDeleted || deletedAt)
            return res.status(400).send({ status: false, message: "Action can not be performed" });
        const product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product)
            return res.status(404).send({ status: false, message: "No products found or product has been deleted" })



        if (title) {
            if (!isEmpty(title)) {
                if (!stringCheck(title))
                    return res.status(400).send({ status: false, message: "title invalid" });
                let uniqueTitle = await productModel.findOne({ title: { $regex: title, $options: "i" } })
                if (uniqueTitle) {
                    if (uniqueTitle.title.toUpperCase() == title.toUpperCase()) {
                        return res.status(400).send({ status: false, message: "title is already exsits" })
                    }
                }
                product.title = title
            }
        }

        if (description) {
            if (!isEmpty(description)) {
                if (!stringCheck(description))
                    return res.status(400).send({ status: false, message: "description invalid" });
                product.description = description
            }
        }

        if (price) {
            if (!isEmpty(price)) {
                if (!price.match(/^\d{0,8}(\.\d{1,4})?$/))
                    return res.status(400).send({ status: false, message: "price invalid" })
                product.price = price
            }
        }

        if (currencyId) {
            if (!isEmpty(currencyId))
                if (currencyId !== 'INR')
                    return res.status(400).send({ status: false, message: "currencyId must be INR only" });
            product.currencyId = currencyId
        }

        if (currencyFormat) {
            if (!isEmpty(currencyFormat))
                if (currencyFormat !== '₹')
                    return res.status(400).send({ status: false, message: "currencyformat must be ₹ only" });
            product.currencyFormat = currencyFormat

        }

        if (availableSizes) {
            if (!isEmpty(availableSizes))
                if (availableSizes) {
                    let arr1 = ["S", "XS", "M", "X", "L", "XXL", "XL"]
                    var arr2 = availableSizes.toUpperCase().split(",").map((s) => s.trim())
                    for (let i = 0; i < arr2.length; i++) {
                        if (!arr1.includes(arr2[i])) {
                            return res.status(400).send({ status: false, message: "availableSizes must be [S, XS, M, X, L, XXL, XL]" });
                        }
                    }
                    product.availableSizes = arr2
                }
        }

        if (isFreeShipping) {
            if (!isEmpty(isFreeShipping))
                if (isFreeShipping !== ('true' || 'false')) {
                    return res.status(400).send({ status: false, message: "isFreeshipping is a boolean type only" });
                }
            product.isFreeShipping = isFreeShipping
        }

        if (style) {
            if (!isEmpty(style))
                product.style = style
        }

        if (installments) {
            if (!isEmpty(installments))
                if (!installments.match(/^[0-9]{1,2}$/))
                    return res.status(400).send({ status: false, message: "installment invalid" });
            product.installments = installments
        }



        if (productImage.length > 0) {
            if (productImage.length > 1)
                return res.status(400).send({ status: false, message: "only one image at a time" });
            if (!checkImage(productImage[0].originalname))
                return res.status(400).send({ status: false, message: "format must be jpeg/jpg/png only" })
            let uploadedFileURL = await uploadFile(productImage[0]);
            product.productImage = uploadedFileURL
        }


        await product.save()
        res.status(200).send({ status: true, message: "success", data: product })
    } catch (e) {
        console.log(e.message);
        res.status(500).send({ status: false, message: e.message });
    }
}

//================================================[delete product api]==================================================================

const deleteByid = async function (req, res) {
    try {
        let productId = req.params.productId
        if (!isValidObjectId(productId))
            return res.status(400).send({ status: false, message: "Invalid ProductId in params" });

        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) return res.status(404).send({ status: false, message: "No products found or product has been deleted" })

        let deleteProduct = await productModel.findOneAndUpdate({ _id: productId }, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true })
        res.status(200).send({ status: true, message: " Product Deleted Successfully", data: deleteProduct })
    }
    catch (e) {
        console.log(e.message);
        res.status(500).send({ status: false, message: e.message });
    }
}



module.exports = { createProduct, getProduct, productByid, updateProduct, deleteByid }
