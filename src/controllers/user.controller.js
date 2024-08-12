
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js'
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'
import { Subcription } from "../models/subcription.model.js";
import mongoose from "mongoose";


const generateAccessAndRefreshToken = async (userId) => {
   try {
      const user = await User.findById(userId)
      const acessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken
      await user.save({ validateBeforeSave: false })

      return { acessToken, refreshToken }

   } catch (error) {
      throw new ApiError(500, "Something Went Wrong While Generating Refresh And Access Token")
   }
}

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
      username, email, password, fullName
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

   const existedUser = await User.findOne({
      $or: [{ email }, { username }]
   })

   if (existedUser) {
      throw new ApiError(409, "User with email or username already exits")
   }

   // console.log(req.files); 


   const avatarLocalPath = req.files?.avatar[0]?.path;
   // const coverImageLocalPath = req.files?.coverImage[0]?.path

   let coverLocalPath;
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.lenght > 0) {
      coverLocalPath = req.files.coverImage[0].path
   }

   if (!avatarLocalPath) {
      throw new ApiError(400, "avatar File Is required")
   }


   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverLocalPath)

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

const loginUser = asyncHandler(async (req, res) => {
   // reqesr body = data
   // username or Email base Login 
   // find the user
   // password check 
   // access & Refresh Token 
   // send in Cookies 

   const { email, username, password } = req.body

   if (!username && !email) {
      throw new ApiError(400, "username or email is required")
   }

   const user = await User.findOne({
      $or: [{ username }, { email }]
   })

   if (!user) {
      throw new ApiError(404, "user does not exit")
   }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
      throw new ApiError(401, "password Incorrect")
   }

   const { acessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

   const options = {
      httpOnly: true,
      secure: true
   }

   return res
      .status(200)
      .cookie("accessToken", acessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
         new ApiResponse(
            200,
            {
               user: loggedInUser, acessToken, refreshToken
            },
            "User Logged In Successfully"
         )
      )

})

const logoutUser = asyncHandler(async (req, res) => {
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $set: { refreshToken: undefined }
      },
      {
         new: true
      }
   )

   const options = {
      httpOnly: true,
      secure: true
   }

   return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(
         new ApiResponse(
            200,
            {},
            "user Logged Out Successfully"
         )
      )
})

const refreshAccesstoken = asyncHandler(async (req, res) => {
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

   if (!incomingRefreshToken) {
      throw new ApiError(401, " unauthorized Request")
   }

   try {
      const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
      )

      const user = await User.findById(decodedToken?._id)

      if (!user) {
         throw new ApiError(401, "Invalid Refresh Token")
      }

      if (incomingRefreshToken !== user?.refreshToken) {
         throw new ApiError(401, "refresh Token is Expired Or Used")
      }

      const options = {
         httpOnly: true,
         secure: true
      }

      const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)

      return res
         .status(200)
         .cookie("accessToken", newAccessToken, options)
         .cookie("refreshToken", newRefreshToken, options)
         .json(
            new ApiResponse(
               200,
               { acessToken, newRefreshToken: newRefreshToken },
               "access Token Refreshed"
            )
         )
   } catch (error) {
      throw new ApiError(401, error?.message || "Invalid Refresh Token")
   }
})

const changeCurrantPassword = asyncHandler(async (req, res) => {
   const { oldPassword, newPassword } = req.body

   const user = await User.findById(req.user?._id)

   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

   if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid Old Password")
   }

   user.password = newPassword

   await user.save({ validateBeforeSave: false })

   return res
      .status(200)
      .json(
         new ApiResponse(200, {},
            "password change Successfully"
         ))


})

const getuCurrentUser = asyncHandler(async (req, res) => {
   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            req.user,
            "Current user fetched Successfully"
         )
      )
})

const updateAccoutDetails = asyncHandler(async (req, res) => {
   const { fullName, email } = req.body

   if (!fullName || !email) {
      throw new ApiError(400, "All Fields Are require")
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            fullName,
            email
         }
      },
      { new: true }
   ).select("-password")

   return res.
      status(200)
      .json(
         new ApiResponse(
            200,
            "Account Details Updated Successfully"
         )
      )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
   const avatarLocalPath = req.file?.path

   if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar File is Missing ")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if (!avatar.url) {
      throw new ApiError(400, "Error while Uploading On Avatar")
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            avatar: avatar.url
         }
      },
      { new: true }
   ).select("-password")

   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            user,
            " Avatar  Update Successfully"
         )
      )

})

const updateUserCoverImage = asyncHandler(async (req, res) => {
   const coverImageLocalPath = req.file?.path

   if (!coverImageLocalPath) {
      throw new ApiError(400, "coverImage  File is Missing ")
   }

   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if (!coverImage.url) {
      throw new ApiError(400, "Error while Uploading On coverImage")
   }

   const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
         $set: {
            coverImage: coverImage.url
         }
      },
      { new: true }
   ).select("-password")

   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            user,
            "coverImage Update Successfully"
         )
      )

})

const getUserChannelProfile = asyncHandler(async (req, res) => {
   const { username } = req.params
   if (!username?.trim()) {
      throw new ApiError(400, "username is missing")
   }

   const channel = await User.aggregate([
      {
         $match: {
            username: username?.toLowerCase()
         }
      },
      {
         $lookup: {
            from: "subcriptions",
            localField: "_id",
            foreignField: "Channel",
            as: "subcribers"
         }
      },
      {
         $lookup: {
            from: "subcriptions",
            localField: "_id",
            foreignField: "subcriber",
            as: "subcribedTo"
         }
      },
      {
         $addFields: {
            SubcriberCount: {
               $size: "$subcribers"
            },
            channelsSubcribedToCount: {
               $size: "subcribedTo"
            },
            isSubcribed: {
               $cond: {
                  if: { $in: [req.user?._id, "$subcribers.subcriber"] },
                  then: true,
                  else: false
               }
            }
         }
      },
      {
         $project: {
            fullName: 1,
            username: 1,
            SubcriberCount: 1,
            channelsSubcribedToCount: 1,
            isSubcribed,
            avatar: 1,
            coverImage: 1,
            email: 1,

         }
      }
   ])

   if (!channel?.length) {
      throw new ApiError(404, "Channel Does Not Exists")
   }

   return res
      .status(200)
      .json(
         new ApiResponse(
            200,
            channel[0],
            "user Channel fetch Successfully"
         )
      )
})

const getWatchHistory = asyncHandler(async (req, res) => {
   const user = await User.aggregate([
      {
         $match: {
            _id: new mongoose.Types.ObjectId(req.user._id)
         }
      },
      {
         $lookup: {
            from: "videos",
            localField: "watchHistory",
            foreignField: "_id",
            as: "watchHistory",
            pipeline: [    
               {
                  $lookup: {
                     from: "users",
                     localField: "owner",
                     foreignField: "_id",
                     as: "owner",
                     pipeline:[
                        {
                           $project:{
                              fullName:1,
                              username:1,
                              avatar:1
                           }
                        }
                     ]
                  }
               },
               {
                  $addFields:{
                     owner:{
                        $first:"$owner"
                     }
                  }
               }
            ]
         }
      },
   ])

   return req
   .status(200)
   .json(
      new ApiResponse(
         200,
         user[0].watchHistory,
         "watch Histroy fetch Successfully"
      )
   )
})

export {
   registerUser,
   loginUser,
   logoutUser,
   refreshAccesstoken,
   changeCurrantPassword,
   getuCurrentUser,
   updateAccoutDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserChannelProfile,
   getWatchHistory
}