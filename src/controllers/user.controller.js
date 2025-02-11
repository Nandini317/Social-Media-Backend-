import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiErrors.js"

const registerUser = asyncHandler( async(req, res) =>{
    // res.status(200).json({        // just for starting , testing api
    //     message:"ok"
    // })

    // 1. get user details from frontend acc to user model : sari user details hmein "req.body"  mein milti hai agar form se ya direct json se data aa rha hai to (abhi url ki baat ni ki)
    // 2. validation --not empty
    // 3. check if user already exists how ?? unique email or unique username 
    // 4. files ? avatar and coverimage 
    // 5. upload them to cloudinary (we already have written  a uitility ) , check fif avatar is correctly uploaded or not 
    // 6. create user object -- create entry in db 
    // 7. remove password and refresh token from response 
    // 8. check for user creation i.e response 
    // 9. return res 

    const {username , email,fullName , password} = req.body
    console.log( "username : " , username  )

    if([fullName , email , username , password].some((field)=>field?.trim() === "")){
        throw new ApiError(400 , "All fields are required ")
    }




} )

export {registerUser} 