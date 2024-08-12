
import { Router } from "express";
import {
    changeCurrantPassword,
    getuCurrentUser,
    getUserChannelProfile,
    getWatchHistory,
    loginUser,
    logoutUser,
    refreshAccesstoken,
    registerUser,
    updateAccoutDetails,
    updateUserAvatar,
    updateUserCoverImage
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxcount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

/*  Secure Route  */
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccesstoken)
router.route("/change-password").post(verifyJWT, changeCurrantPassword)
router.route("/currant-user").get(verifyJWT, getuCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccoutDetails)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router