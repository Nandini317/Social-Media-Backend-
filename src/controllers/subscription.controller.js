import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId){
        throw new ApiError(400, "Channel id is required")
    }
    if(!isValidObjectId(channelId)){
        throw new ApiError(400 , "Invalid channel id")
    }
    const userId = req.user?._id
    if(!userId){
        throw new ApiError(401 , "Unauthorized user")
    }

    const isSubscribed = await Subscription.findOne({
        subscriber : userId , 
        channel : channelId
    })
    if(isSubscribed){
        const istoggled = await Subscription.findByIdAndDelete(isSubscribed._id)
        if(!istoggled){
            throw new ApiError(500 , "Error in toggling Subscription ")
        }
        return res.status(200).json(new ApiResponse(200 , {} , "Subscription toggled Successfully "))

    }
    else{
        const subscribed = await Subscription.create({
            channel : channelId , 
            subscriber : userId
        })
        if(!subscribed){
            throw new ApiError(500 , "Error in subscribing")
        }
        return res.status(200).json(new ApiResponse(200 , subscribed , "Subscription toggled Successfully "))
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId){
        throw new ApiError(400 , "Channel id is required")
    }
    if(!isValidObjectId(channelId)){
        throw new ApiError(400 , "Invalid channel id")
    }
    const subscribers = await Subscription.aggregate([
        {
            $match:{
                channel : new mongoose.Types.ObjectId(channelId)
            }
        } , 
        { 
            $lookup:{
                from : "users",
                localField :"subscriber" , 
                foreignField : "_id" , 
                as: "subscriber"  , 
            }
        } , 
        {
            $unwind : '$subscriber'
        } , 
        {
            $project: {
                _id: 0,
                subscriber: {
                    _id: 1 , //"$subscriber._id" ????
                    avatar: 1 , 
                    username: 1 , 
                    subscriberName : "$subscriber.fullName" 
                },
            }
             
        }
    ])
    if(subscribers?.length === 0){
        return res.status(200).json(new ApiResponse(200 , [] , "No subscribers found"))
    }
    const data = {
        subscribers , 
        totalSubscribers : subscribers.length
    }
    if(!data){
        throw new ApiError(500 , "Error in fetching subscribers")
    }
    return res.status(200).json(new ApiResponse(200 , data , "Subscribers fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!subscriberId){
        throw new ApiError(400 , "Subscriber id is required")
    }
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400 , "Invalid subscriber id")
    }
    const channels = await Subscription.aggregate([
        {
            $match : {
                subscriber : new mongoose.Types.ObjectId(subscriberId)
            } 
        } , 
        {
            $lookup : {
                from : "users" , 
                localField : "channel" ,
                foreignField : "_id" ,
                as : "channel"
            }
        } , 
        {
            $unwind : '$channel'
        } , 
        {
            $project: {
                _id: 0,
                channel: {
                    _id: 1,
                    avatar: 1,
                    username: 1,
                    coverImage: 1,
                    channelName: '$channel.fullname',
                },
            }
        }
    ])
    if(channels?.length === 0){
        return res.status(200).json(new ApiResponse(200 , [] , "No channels found"))
    }
    const data = {
        channels  , 
        totalChannels : channels.length
    }
    if(!data){
        throw new ApiError(500 , "Error in fetching channels")
    }
    return res.status(200).json(new ApiResponse(200 , data , "Channels fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}