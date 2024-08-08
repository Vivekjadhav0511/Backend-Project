import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from 'jsonwebtoken'
import { User } from "../models/user.model";

export const verifyJWT = asyncHandler(async(req, _ ,next)=>{
   try {
     const Token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer " , "")
 
     if (!Token) {
         throw new ApiError(401 , " unauthorize request")
     }
     
     const decodedToken = jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET)
 
     const user =  await User.findById(decodedToken?._id).select("password" , "refreshToken")
 
     if (!user) {
         throw new ApiError(401 , "Invalid Access Token ")  
     }
 
     req.user = user;
     next()
   } catch (error) {
    throw new ApiError(401, "invalid access Token")
   }
})