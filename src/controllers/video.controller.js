import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination


})

const publishAVideo = asyncHandler(async (req, res) => {
    console.log("yes we are getting a request " + req.body)   

    const { title, description} = req.body
    console.log(req.files)
    const owner = req.user?._id

    if(!owner){
        throw new ApiError(401, "Unauthorized Request")
    }
    
    if([title , description].some((field)=>field?.trim() === "")){
            throw new ApiError(400 , "All fields are required ")
    }
    //for video path 
    const videoLocalPath = req.files?.videoFile[0]?.path 

    if(!videoLocalPath){
        
        throw new ApiError(400, "Video file is empty or invalid")
    }

    const video = await uploadOnCloudinary(videoLocalPath)
    if(!video){
        throw new ApiError(400 , "error while uploading video ")
    }

    //for thumbnail :
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path 
    if(!thumbnailLocalPath){
        throw new ApiError(400 , "Thumbnail file is empty or invalid")
    }
    const thumbnailuploaded = await uploadOnCloudinary(thumbnailLocalPath)
    if(!thumbnailuploaded){
        throw new ApiError(400 , "error while uploading thumbnail ")
    }

    //create video
    const videopublish = await Video.create({
        videoFile : video.url , 
        thumbnail :  thumbnailuploaded.url ,
        title , 
        description ,
        owner ,  
        ispublished : true , 
        duration : video.duration

    })
    if(!videopublish){
        throw new ApiError(400 , "error while publishing video")
    }
    
    return res.status(200).json(new ApiResponse(200 , videopublish,"published video successfully "))

    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400 , "Invalid video id")
    }
    //const video = await Video.findById(videoId)
   const video = await Video.aggregate([

    {
        $match : {
            _id : mongoose.Types.ObjectId(videoId)
        }
    } , 
    {
        $lookup:{ //lookup always returns ans arrays , so we can unwind it 
            from : 'users' , 
            localField:"owner" , 
            foreignField : "_id" , 
            as :"channel"
        }
    } ,
    {
        $unwind : "$channel"
    } , 
    {
        $project : {
            _id :1 , 
            title : 1 , 
            description :1 , 
            thumbnail : 1 , 
            videoFile : 1 , 
            duration : 1 , 
            ispublished : 1 , 
            createdAt : 1 ,
            channel : {
                _id : 1 , 
                username: 1 , 
                avatar : 1 
            }
        }
    }
   ]) ; 

   if(!video){
    throw new ApiError(404 , "video not found ")
   }
   return res.status(200).json(new ApiResponse(200 , video , "video found successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    //if the current user is the owner of the video , then only , he can update the details  
    const {title , description} = req.body 
    const thumbnailLocalPath = req.file?.path

    if(!title && !description && !thumbnailLocalPath){
        throw new ApiError(400 , "Atleast one field is required to update")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400 , "Invalid video id")
    }

    const videocheck  = await Video.findById(videoId)
    if(!videocheck){
        throw new ApiError(400 , "Invalid video id")
    }
    // Ensure the user updating the video is the owner
    if (!videocheck.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    const updatedinfo = {
        title , 
        description
    }


    if(thumbnailLocalPath){
        const thumbnailUploaded = await uploadOnCloudinary(thumbnailLocalPath)
        if(!thumbnailUploaded){
            throw new ApiError(400 , "Error while uploading thumbnail")
        }
        updatedinfo.thumbnail = thumbnailUploaded.url
    }

    const video = await Video.findByIdAndUpdate(videoId , updatedinfo , {new : true })
    if(!video){
        throw new ApiError(400 , "error while updating ")
    }
    
    return res.status(200).json(new ApiResponse(200 , video , "video updated successfully "))


})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400 , "Invalid video id")
    }
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Delete the video file from Cloudinary if it exists
    if (video.videoFile?.public_id) {
        await deleteOnCloudinary(video.videoFile.public_id);
    }

    // Delete the thumbnail from Cloudinary if it exists
    if (video.thumbnail?.public_id) {
        await deleteOnCloudinary(video.thumbnail.public_id);
    }

    // Now delete the video document from MongoDB
    await Video.findByIdAndDelete(videoId);
    return res.status(200).json(new ApiResponse(200 ,{} , "video deleted successfully "))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400 , "Invalid video Id")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404 , "Video not found")
    }

    if(video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to toggle this video!");
    }
    

    const updatedvideo = await Video.findByIdAndUpdate(videoId , {ispublished : !video.ispublished} , {new : true})
    if(!updatedvideo){
        throw new ApiError(400 , "error while updating video")
    }
    return res.status(200).json(new ApiResponse(200 , updatedvideo , "publish toggle successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}