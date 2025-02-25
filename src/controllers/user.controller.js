import {asyncHandler} from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import {ApiError} from "../utils/ApiErrors.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"



const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findOne(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken 
        await user.save({validateBeforeSave : false})

        return {accessToken , refreshToken}
        
    } catch (error) {
        throw new ApiError(500 , "Something went wrong while generating refresh and access tokens ")
    }
} 

const registerUser = asyncHandler( async(req, res) =>{
    // res.status(200).json({        // just for starting , testing api
    //     message:"ok"
    // })
    // 1. get user details from frontend acc to user model : sari user details hmein "req.body"  mein milti hai agar form se ya direct json se data aa rha hai to (abhi url ki baat ni ki)// 2. validation --not empty// 3. check if user already exists how ?? unique email or unique username // 4. files ? avatar and coverimage // 5. upload them to cloudinary (we already have written  a uitility ) , check fif avatar is correctly uploaded or not  // 6. create user object -- create entry in db // 7. remove password and refresh token from response // 8. check for user creation i.e response  // 9. return res 

    const {username , email,fullName , password} = req.body
    console.log( "username : " , username  )

    if([fullName , email , username , password].some((field)=>field?.trim() === "")){
        throw new ApiError(400 , "All fields are required ")
    }

    //do user already exist ?
    const existedUser = await User.findOne({
        $or: [{ username } ,{ email }] //out of this array of objects if , User can find any user with same email or usename it will return  
    })

    if(existedUser){
        throw new ApiError(409 , 'User with this email or username already exists ')
    }

    //console.log(req.files);

    //kyuki hmne is controller ko call krne ke pehle user.routes mein multer middleware , use kiya tha , so vo kuch additional properties proide krta hai 
    //just like req.body is provided by express by default , req.files is provided by multer but ho bhi skta hai nahi bhi 
    const avatarLocalPath = req.files?.avatar[0]?.path; //.path is automatically added by Multer and contains the full file location.
    //const coverImageLocalPath = req.files?.coverImage[0]?.path ;
    let coverImageLocalPath ;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files?.coverImage[0]?.path ;
    }

    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar file is required" ) ; 
    }

    //now upload on cloudinary 
    const avatar = await uploadOnCloudinary(avatarLocalPath) ; 
    const coverImage = await uploadOnCloudinary(coverImageLocalPath) ; 

    if(!avatar){
        throw new ApiError(400 , "Avatar file is required" ) ; 
    }
    
    //create a user object and entry in database 
    const user = await User.create({
        fullName , 
        avatar: avatar.url , 
        coverImage : coverImage?.url || "" , 
        email , 
        password  ,
        username :username.toLowerCase() 
    })

    //to check if User is created , we can do this by finding user by User.findById 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500 , "Something went wrong while registering the user ")
    }

    return res.status(201).json(
        new ApiResponse(200 , createdUser , "User Registered Successfully")
    )


} )

const loginUser = asyncHandler( async(req, res)=>{
    //req body se data 
    // username or email 
    //find the user 
    //check password 
    //access and refresh token generation 
    //send secure cookies and send res 

    const {email , username , password } = req.body ;
    if(!(username || email)  ){
        throw new ApiError(400 , "username or email is required ")
    }
    const user = await User.findOne({
        $or :[{username} , {email}]
    })

    if(!user){
        throw new ApiError(404 , "user does not exist")
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401 , "Invalid user Credentials ")
    }

    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id)
    
    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken")

    const options = {
        httpOnly : true , 
        secure : true 
    }
    return res.status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new ApiResponse(200 , 
            {
                user : loggedInUser , accessToken , refreshToken
            } ,
            "user loggedIn successfully"
        )
    )

} )

const logoutUser  = asyncHandler( async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id  , 
        {
            $set:{
                refreshToken : undefined 
            }
        },
        {
            new : true 
        }
    )

    const options = {
        httpOnly : true , 
        secure : true 
    }
    return res.status(200)
    .clearCookie("accessToken" , options )
    .clearCookie("refreshToken" , options)
    .json(new ApiResponse(200 , {}, "User LoggedOut Successfully"))
})

const refreshAccessToken = asyncHandler(async (req , res) =>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if(!incomingRefreshToken){
        throw new ApiError(401 ,"unauthorized Request");
    }
    try {
        const decodedToken =  jwt.verify(incomingRefreshToken ,process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401 , "Invalid Refresh Token ")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401 , "Refresh Token is expired or used ") ; 
        }
    
        const options = {
            httpOnly : true , 
            secure :true 
        }
        const {accessToken , newrefreshToken} = await generateAccessAndRefreshToken(user._id) ;
        return res
        .status(200).cookie("accessToken" , accessToken , options)
        .cookie("refreshToken" , newrefreshToken , options)
        .json(
            new ApiResponse(
                200 ,
                {accessToken , refreshToken : newrefreshToken} , 
                'Access token refreshed'
            )
        )
    } catch (error) {
        throw ApiError( 401 , error?.message || "Invalid Refresh Token")
    }
})

export {registerUser , loginUser , logoutUser , refreshAccessToken} 