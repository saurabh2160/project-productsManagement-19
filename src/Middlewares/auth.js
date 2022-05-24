const jwt=require("jsonwebtoken")

//Authentication & Authorization

const mid1 = async function (req, res, next) {
    try {
      let token = req.headers["x-api-key"] || req.headers["X-API-KEY"];
  
      if (!token) return res.status(401).send({ status: false, msg: "JWT Token must be present" });
  
        let decodedToken
        try{
             decodedToken = await jwt.verify(token, "UrAnIuM#GrOuP@19")
            
            if(!decodedToken) return res.status(401).send({status:false, message:"Invalid token."})
        }
        catch (err) {
          return  res.status(401).send({ status: false, message: "Invalid Token", error:err.message })
        }
        req.userId=decodedToken.userId
      
      next();
  
    } catch (err) {
     return res.status(500).send({ msg: "Error", error: err.message })
    }
  
  }
  
  module.exports.mid1 = mid1