import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    
    const user = req.user 
    if(!user){
        throw new ApiError(400 , "user not found")
    }


    const videoStats = await Video.aggregate([
        {
            $match: {
                owner : new mongoose.Types.ObjectId(req.user._id)
            }
        } , 
        {
            $group : {
                _id : null , 
                totalVideoViews : {
                    $sum : "$view"
                } , 
                totalVideos : {
                    $sum : 1 ,
                } , 
                videos : {
                    $push: "$_id"
                }
            }
        }
    ]);
    const totalSubscribers  = await Subscription.aggregate([
        {
            $match : {
                channel : new mongoose.Types.ObjectId(req.user._id)
            }
        }, 
        {
            $group : {
                _id : null , 
                totalSubscibers : {
                    $sum : 1 , 
                }
            }
        }
    ])


    const stats = {
        totalVideoViews : videoStats[0]?.totalVideoViews ||0 , 
        totalVideos : videoStats[0]?.totalVideos ||0 , 
        totalSubscribers : totalSubscribers[0]?.totalSubscibers  || 0, 
    }

    
    return res.status(200).json(new ApiResponse(201 , stats , "stats found successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const {page = 1 , limit = 10 } = req.query 
    const options = {
        page : parseInt(page , 10)  , 
        limit : parseInt(limit , 10)
    }
    const user = req.user 
    if(!user){
        throw new ApiError(400 , "user not found")
    }
    const totalVideos = await Video.countDocuments(
        {
            owner : req.user._id
        }
    )

    const paginatedvideos = await Video.aggregatePaginate(Video.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(req.user._id)
            }
        } , 
        {
            $sort : {
                createdAt : -1 
            }
        } ,
        {
            $project : {
                videoFile :1 , 
                thumbnail : 1 , 
                title : 1 , 
                _id:1 , 
                description:1 , 
                duration :1 , 
                view : 1 , 
                ispublished : 1 
            }
        }
    ]) , options )

     
    if(!paginatedvideos){
        throw new ApiError(400 , "error while fetching videos")
    }
    return res.status(200).json(new ApiResponse(201 , {paginatedvideos , totalVideos} , "channel videos fetched successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }
