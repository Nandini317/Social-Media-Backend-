import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400 , "videoId is not valid")
    }
    const user = req.user
    if(!user){
        throw new ApiError(403 , "user is not authorized to like")
    }
    const liked = await Like.findOne({video:videoId , LikedBy : req.user._id}) 
    if(liked){
        const deletedLike= await Like.findByIdAndDelete(liked._id)
        if(!deletedLike){
            throw new ApiError(500 , "Error while unliking the video")
        }
        return res.status(201).json(new ApiResponse(200 , deletedLike , "like deleted successfully"))
    }
    else{
        const like = await Like.create({
            video:videoId , 
            LikedBy : req.user._id
        })
        if(!like){
            throw new ApiError(500 , "Error while liking the video")
        }
        return res.status(200).json(new ApiResponse(200 , like , "liked video successfully"))
    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
  
    if(!isValidObjectId(commentId)){
        throw new ApiError(400 , "commentId is not valid")
    }
    const user = req.user
    if(!user){
        throw new ApiError(403 , "user is not authorized to like")
    }
    const liked = await Like.findOne({comment:commentId , LikedBy : req.user._id}) 
    if(liked){
        const deletedLike= await Like.findByIdAndDelete(liked._id)
        if(!deletedLike){
            throw new ApiError(500 , "Error while unliking the comment")
        }
        return res.status(200).json(new ApiResponse(201 , deletedLike , "like deleted successfully"))
    }
    else{
        const like = await Like.create({
            comment:commentId , 
            LikedBy : req.user._id
        })
        if(!like){
            throw new ApiError(500 , "Error while liking the comment")
        }
        return res.status(200).json(new ApiResponse(201 , like , "liked comment successfully"))
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    
  
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400 , "tweetId is not valid")
    }
    const user = req.user
    if(!user){
        throw new ApiError(403 , "user is not authorized to like")
    }
    const liked = await Like.findOne({tweet:tweetId , LikedBy : req.user._id}) 
    if(liked){
        const deletedLike= await Like.findByIdAndDelete(liked._id)
        if(!deletedLike){
            throw new ApiError(500 , "Error while unliking the tweet")
        }
        return res.status(200).json(new ApiResponse(200 , deletedLike , "like deleted successfully"))
    }
    else{
        const like = await Like.create({
            tweet:tweetId , 
            LikedBy : req.user._id
        })
        if(!like){
            throw new ApiError(500 , "Error while liking the tweet")
        }
        return res.status(200).json(new ApiResponse(201 , like , "liked tweet successfully"))
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id ; 
    if(!userId){
        throw new ApiError(400 , "User not found")
    }

    const likedVideos = await Like.aggregate([
        {
            $match: {
                LikedBy: new mongoose.Types.ObjectId(userId),
                video: { $ne: null },
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoOwner",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                        },
                    },
                    {
                        $unwind: "$owner",
                    },
                    {
                        $project: {
                            thumbnail: 1,
                            title: 1,
                            owner: {
                                avatar: 1,
                                fullName: 1,
                                userName: 1,
                            },
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$videoOwner",
        },
    ]);
    if(!likedVideos){
        throw new ApiError(400 , "error while fetching liked Videos ")
    }
    return res.status(200).json(new ApiResponse(201 , likedVideos , "liked videos fetched successfully "))
    
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}