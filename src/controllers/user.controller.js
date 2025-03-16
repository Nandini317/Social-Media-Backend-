import {asyncHandler} from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"
import {ApiError} from "../utils/ApiErrors.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import mongoose from "mongoose"



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
    await User.findByIdAndUpdate( //finds a user by _id and updates the specified fields.
        req.user._id  , 
        {
            $unset:{
                refreshToken : 1 
            }
        },
        {  
            new : true //It returns the updated document if { new: true } is passed
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

const changeCurrentPassword = asyncHandler(async(req, res)=>{
    
    const {oldPassword , newPassword} = req.body 
   
    const user = await User.findById(req.user?._id) 
    const isPasswordCorrect =  await user.isPasswordCorrect(oldPassword) 

    if(!isPasswordCorrect){
        throw new ApiError(404 , "Invalid password ") 
    }
    user.password = newPassword
    await user.save({validateBeforeSave :false})

    return res
    .status(200)
    .json( new ApiResponse(200 , {} , "Password changes Successfully "))

})

const getCurrentUser = asyncHandler(async(req, res) =>{
    return res
    .status(200)
    .json(200 , req.user ,"current user fetched successfully ")
})

const updateAccountDetails = asyncHandler(async(req, res)=>{
    const {fullName , email} = req.body
    if(!fullName || !email){
        throw new ApiError(400 , "All fields are required ")
    }
    const user= await User.findByIdAndUpdate(
        req.user?._id ,
        {
            $set:{
                fullName , 
                email
            }
        } ,
        {new:true } //is se updated info return hoti hai , jo hm user mein store krnege  
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200 , user , "Updated Account details successfully"))
})

const updateUserAvatar = asyncHandler(async(req , res)=>{
    const avatarLocalPath = req.file?.path  //because , we are just updating 1 file oonly ..so the middleware will have only 1 file 
    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar file is missing") 
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400 , "Error while uploading avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id , 
        {
            $set:{
                avatar:avatar.url
            }
        } 
    ,{new : true }).select("-password")

    return res.status(200).json(new ApiResponse(200 ,user, "avatar updated successfully" ))
    

})
const updateCoverImage = asyncHandler(async(req , res)=>{
    const coverImageLocalPath = req.file?.path  //because , we are just updating 1 file oonly ..so the middleware will have only 1 file 
    if(!coverImageLocalPath){
        throw new ApiError(400 , "Avatar file is missing") 
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400 , "Error while uploading coverImage")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id , 
        {
            $set:{
                coverImage:coverImage.url
            }
        } 
        ,{new : true }).select("-password")

    return res.status(200).json(new ApiResponse(200 ,user, "cover image updated successfully" ))

})

const getUserCurrentProfile = asyncHandler(async(req , res)=>{
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400 , "username is required ")
    }
    
    //aggregation pipelines 
    const channel =  await User.aggregate([
        {
            $match :{
                username : username?.toLowerCase()
            }   
        },
        {
            $lookup:{
              from : "subscriptions" ,
              localField : "_id" ,
                foreignField : "channel" ,
                as : "subscribers" 
            }
        } , 
        {
            $lookup:{
                from : "subscriptions" ,
                localField : "_id" ,
                foreignField : "subscriber" ,
                as : "subscribedTo" 
            }
        } , 
        {
            $addFields:{
                subscribersCount : {
                    $size : "$subscribers"
                },
                channelsSubscribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed : {
                    $cond : {
                        if : {$in : [req.user?._id , "$subscribers.subscriber"]} ,
                        then:true , 
                        else : false 

                    }
                }
            }
        } ,
        {
            $project : {
                fullName :  1,
                username:1 , 
                subscribersCount:1 , 
                channelsSubscribedToCount:1  , 
                isSubscribed:1 , 
                avatar : 1 , 
                coverImage : 1 , 
                email : 1

            }

        }
        

    ])

    if(!channel?.length){
        throw new ApiError(404 , "User not found")
    }

    return res.
        status(200)
        .json(new ApiResponse(200 , channel[0] ,"User channel fetched successfully" ))
})

const getWatchHistory = asyncHandler(async(req , res)=>{
    const user = await User.aggregate([
        {
            $match : { 
                //jb bhi hm user ki watch history fetch krte hai , to hm user ki id se hi fetch krte hai
                //user id jo hoti hai mongo db ki that is a string , so we have to convert it into ObjectId
                // without aggrgation pipeline , it is automaticlly converted into ObjectId by mongoose but 
                // aggregation pipeline ka code aese hi jata hai without this conversion , so we have to do it manually 
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        } , 
        {
            $lookup : {
                from : "videos" , 
                localField : "watchHistory" , 
                foreignField : "_id" ,
                as : "watchHistory" , 
                pipeline :[
                    {
                        $lookup : {
                            from : "users" , 
                            localField : "owner" , 
                            foreignField:"_id" , 
                            as :"owner" ,
                            pipeline : [
                                {
                                    $project : {
                                        fullName : 1 , 
                                        username : 1 , 
                                        avatar : 1 
                                    }
                                }
                            ]
                        }
                    } , 
                    {
                        $addFields : {
                            owner : {
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ]) 

    return res.status(200).json(new ApiResponse(200 ,user[0].watchHistory , "watch History fetched successfully" ))
})

export {registerUser , loginUser , logoutUser , refreshAccessToken , changeCurrentPassword ,
     getCurrentUser , updateAccountDetails , updateUserAvatar , updateCoverImage , getUserCurrentProfile , getWatchHistory} 