import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    if(!content || content.trim() === ""){
        throw new ApiError(400 , "Content is required")
    }
    const owner = req.user._id
    if(!isValidObjectId(owner)){
        throw new ApiError(400 , "Invalid owner id")
    }
    const tweet = await Tweet.create({content , owner})
    if(!tweet){
        throw new ApiError(500 , "error while creating tweet")
    }
    return res.status(200).json(new ApiResponse(200 , tweet , "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params 
    if(!tweetId){
        throw new ApiError(400 , "Tweet id is required")
    }
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400 , "Invalid tweet id")
    }

    const {content} = req.body 
    if(!content || content.trim() === ""){
        throw new ApiError(400 , "Content is required")
    }

    const updatedtweet = await Tweet.findByIdAndUpdate(tweetId , {content} , {new : true }) 
    if(!updatedtweet){
        throw new ApiError(500 , "error while updating tweet")
    }
    return res.status(200).json(new ApiResponse(200 , updatedtweet , "Tweet updated successfully"))

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}