import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "video id is invalid")
    }
    const comments = await Comment.aggregate([
        {
            $match : {
                video :new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner" , 
                foreignField : "_id" ,
                as:"owner"
            }
        } ,
        {
            $lookup : {
                from : "likes" , 
                localField : "_id" , 
                foreignField  :"comment" , 
                as:"likes"
            }
        } , 
        {
            $addFields :{
                likesCount :{
                    $size : "$likes"
                } , 
                owner : {
                    $first : "$owner"
                },
                
            }
        } , 
        {
            $project : {
                content : 1 , 
                createdAt : 1 , 
                likesCount : 1 , 
                owner : {
                    userName : 1 , 
                    fullName : 1  ,
                    Avatar : 1 
                } , 
                
            }
        }
    ]) 

    const options = {
        page : parseInt(page , 10) , 
        limit : parseInt(limit , 10)
    }
    const fetchedComments = await Comment.aggregatePaginate(comments , options)

    if(!fetchedComments){
        throw new ApiError(400 , "unable to fetch comments ")
    }
    return res.status(200).json(new ApiResponse(200 , fetchedComments , "comments fetched successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body

    const user = req.user?._id 
    if(!user){
        throw new ApiError(400 , "invalid users ")
    }

    if(!content || content?.trim === ""){
        throw new ApiError(400 , "comment content is required")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400 , "videoId is not valid")
    }
    const comment = await Comment.create(
        {
            content ,
            videoId , 
            owner : req.user._id
        }
    )
    if(!comment){
        throw new ApiError(500 , "error while commenting on video")
    }
    return res.status(200).json(new ApiResponse(200 , comment , "commented successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    const {newcontent} = req.body 
    if(!newcontent || newcontent.trim() === ""){
        throw new ApiError(400 , "content is required ")
    }
    const {commentId} = req.params 
    const user = req.user?._id

    if(!isValidObjectId(commentId)){
        throw new ApiError(400 , "valid commentId is required ")
    }
    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "comment not found!");
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to update this comment!");
    }

    const updatedcomment = await Comment.findByIdAndUpdate(
        commentId , 
        {
            $set : {
                content : newcontent
            }
        } ,
        {new : true}
    )
    if(!updatedcomment){
        throw new ApiError(400 , "comment not updated")
    }
    return res.status(200).json(new ApiResponse(200 , updatedcomment , "comment updated successfully "))
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params 
    
    if(!isValidObjectId(commentId)){
        throw new ApiError(400 , "comment Id is not valid")
    }
    const comment = await Comment.findById(commentId)
    if(!comment){throw new ApiError(400 , "Comment not found")}

    if(comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403 , "unauthorized user")
    }
   
    const deleted = await Comment.findByIdAndDelete(commentId)
    if(!deleted){
        throw new ApiError(500, "Something went wrong while deleting comment")
    }
    return res.status(200).json(new ApiResponse(200 , deleted , "comment deleted successfully "))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
