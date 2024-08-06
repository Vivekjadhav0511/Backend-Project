
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js'
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
   /* 
       get user details from frontend 
       validation - not empty
       check if user already exits username , email
       check for images check for images 
       upload them to cloudinary , avatar = & get Url 
       create user object - create entry in db 
       remove password and refresh token field from response 
       check for user creation 
       return res  
   */

   const { fullName, email, username, password } = req.body
   console.log({
      email, username, password, fullName
   });

   /* if (fullName === "") {
      throw new ApiError(400, " Fullname is Required")
   } */

   if (
      [fullName, email, username, password].some((field) =>
         field?.trim() === "")
   ) {
      throw new ApiError(400, "All fields are required")
   }

   const existedUser = User.findOne({
      $or: [{ email }, { username }]
   })

   if (existedUser) {
      throw new ApiError(409, "User with email or username already exits")
   }

   const avatarLocalPath = req.files?.avatar[0]?.path
   const coverImageLocalPath = req.files?.coverImage[0]?.path

   if (!avatarLocalPath) {
      throw new ApiError(400, "avatar File Is required")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if (!avatar) {
      throw new ApiError(400, "avatar File Is required")
   }

   const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
   })

   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
   )

   if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering a user")
   }

   return res.status(201).json(
      new ApiResponse(200, createdUser, "User Register Successfully")
   )

})

export { registerUser }