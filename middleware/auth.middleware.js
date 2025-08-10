import jwt from "jsonwebtoken"
import User from "../models/user.model.js"

export const protectRoute = async (req,res,next)=>{
    try {
        const token = req.cookies.jwt

        if(!token){
            return res.status(401).json({message:"Unauthorized-No token Provided"})
        }
        const verified = jwt.verify(token,process.env.JWT_SECRET)//if not verified it doesnt proceed further

        

        const user = await User.findOne({_id:verified.id}).select("-password")
        if(!user){
            return res.status(401).json({message:"User Not found"})
        }
        req.user = user
        next()
    } catch (error) {
        console.log("Error in Middleware",error.message)
    }
}
