import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError}  from "../utils/ApiErrors.js"
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"

export const verifyJWT = asyncHandler(async(req, res , next)=>{
    try {
        const token = req.cookies?.accessToken ||req.header("Authorization")?.replace("Bearer " , "" ) // ho skta hai user request from se nehi header se aai ho 
        // jb req header se aati hai , to content of header looks like : Authorization : Bearer <token> , so if we need token , then from header's authorizaton ky , just replace the "Bearer " , with "" so that we left with <token>
    
        if(!token){
            throw new ApiError(401 , "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
             
            throw new ApiError(401 , "Invalid Access Token")
        }
    
        req.user = user ;
        next() 
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid Access Token" )
    }

})