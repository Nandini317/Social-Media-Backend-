import {Router} from 'express'
import { registerUser } from '../controllers/user.controller.js'
import {loginUser} from '../controllers/user.controller.js'
import {logoutUser , refreshAccessToken} from '../controllers/user.controller.js'
import {verifyJWT} from '../middlewares/auth.middleware.js'
import jwt from 'jsonwebtoken'

const router = Router() ;
import {upload} from "../middlewares/multer.middleware.js"


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


export default router 