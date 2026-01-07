import {Router} from 'express'
import { registerUser , changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateCoverImage, getUserCurrentProfile } from '../controllers/user.controller.js'
import {loginUser} from '../controllers/user.controller.js'
import {logoutUser , refreshAccessToken} from '../controllers/user.controller.js'
import {verifyJWT} from '../middlewares/auth.middleware.js'
import jwt from 'jsonwebtoken'
import {upload} from "../middlewares/multer.middleware.js"

const router = Router() ;


router.route("/register").post(
    upload.fields([ //middleware 
        {
            name : "avatar",
            maxcount : 1 

        },
        {
            name : "coverImage" , 
            maxCount :1 
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser);

//secured routes 
router.route("/logout").post(verifyJWT , logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT ,changeCurrentPassword)

router.route("/current-user").get(verifyJWT , getCurrentUser)

router.route("/update-account").patch(verifyJWT , updateAccountDetails) //PATCH updates only the specified fields while keeping other fields unchanged.

router.route("/avatar").patch(verifyJWT , upload.single("avatar") , updateUserAvatar) //It processes a single file upload from a form field named 'avatar'.

router.route("/cover-image").patch(verifyJWT , upload.single("coverImage") ,updateCoverImage)

router.route("/c/:username").get(verifyJWT , getUserCurrentProfile)


export default router 
