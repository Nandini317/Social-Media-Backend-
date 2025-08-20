import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from "../models/user.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    if(!name || name.trim() === ""){
        throw new ApiError(400 , "Name is required")
    }
    if(!description || description.trim() === ""){
        throw new ApiError(400 , "Description is required")
    }
    const o = req.user?._id 
    if(!o){
        throw new ApiError(401 , "Unauthorized user")
    }
    const playlist = await Playlist.create({
        name , 
        description , 
        owner : req.user._id , 
    })
    if(!playlist){
        throw new ApiError(500 , "Failed to create playlist")
    }
    return res.status(200).json(new ApiResponse(200 , playlist , "Playlist created successfully"))

    
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if(!userId){
        throw new ApiError(400 , "userId is required")
    }
    if(!isValidObjectId(userId)){
        throw new ApiError(400 , "userId is invalid ")
    }
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    
    const playlists = await Playlist.find({owner: userId});
    if(!playlists){
        throw new ApiError(500  , "playlists not found ")
    }
    return res.status(200).json(new ApiResponse(200 , playlists , "user playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    if(!playlistId){
        throw new ApiError(400 ,"playlist id is required ")
    }
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400 , "playlist not valid")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(500 , 'playlist not found')
    }
    return res.status(200).json(new ApiResponse(200 , playlist , "playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400 , "Invalid playlist id")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400 , "Invalid video id")
    }
    
    const playlist = await Playlist.findById(playlistId )
    if(!playlist){
        throw new ApiError(404 , "Playlist not found")
    }

    if(playlist.videos.includes(new mongoose.Types.ObjectId(videoId))){
        throw new ApiError(400 , 'video already exists in playlist')
    }
    
    const updatedplaylist = await Playlist.findByIdAndUpdate(playlistId , {
        $push : {
            videos :videoId
        } , 
    } , {new : true })
    if(!updatedplaylist){
        throw new ApiError(500 , "Failed to add video to playlist")
    }
    return res.status(200).json(new ApiResponse(200 , updatedplaylist , "Video added to playlist successfully"))    


})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    

    if(!playlistId || !videoId){
        throw new ApiError(400 , "playlistId and videoId is required ")
    }
    
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400 , "Invalid playlist id")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400 , "Invalid video id")
    }
    
    const playlist = await Playlist.findByIdAndUpdate(playlistId , 
        {
            $pull :{
                videos : new mongoose.Types.ObjectId(videoId)
            }
        } , 
        {new : true }
    )
    if(!playlist){
        throw new ApiError(404 , "Error while removing video from playlist")
    }
    return res.status(200).json(new ApiResponse(200 , playlist , "video removed from playlist successfully"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!playlistId){
        throw new ApiError(400 , "playlist not valid ")
    }
    if(!isValidObjectId(playlistId)){
        throw new ApiError(404 , "playlist not valid ")
    }
    const playlist = await Playlist.findByIdAndDelete(playlistId)
    if(!playlist){
        throw new ApiError(404 , "playlist not found")
    }
    return res.status(200).json(new ApiResponse(200 , playlist , "playlist deleted successfully"))

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    
    if(!playlistId){
        throw new ApiError(400 , "Invalid playlist id")
    }
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400 , "Invalid playlist id")
    }
    if(!name && !description){
        throw new ApiError(400 , "need a title or description to update")
    }
    // if([name, description].some((field)=> field?.trim() === "")){
    //     throw new ApiError(400, "All fields are required")
    // }
    const playlist = await Playlist.findByIdAndUpdate(playlistId , 
        {
           $set: {
            name  , 
            description
           }
        } , 
        {
            new : true 
        }
    )
    if(!playlist){
        throw new ApiError(500 , "error while updating")
    }
    return res.status(200).json(new ApiResponse(200 , playlist , "playlist updated succesfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
