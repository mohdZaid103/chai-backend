import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    if(!content){
        throw new ApiError(401, "content is required")
    }
    const tweet = await Tweet.create({
        content,
        owner:req.user._id
    })

    if(!tweet){
        throw new ApiError(501, "failed to create a tweet")
    }
    return res.status(200).json(new ApiResponse(200 ,tweet, "tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(401, "Invalid user Id")
    }

    const tweets  =await Tweet.find({owner:userId})
    .sort({createdAt:-1})

    return res.status(200).json(new ApiResponse(200, tweets, "tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    const {tweetId} = req.params
    if(!content||content.trim()===""){
        throw new ApiError(401,"content is required")
    }
    if(!isValidObjectId(tweetId)){
        throw new ApiError(401,"invalid tweetId")
    }

    const tweet  = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(501, "cannot fetch tweet")
    }

    if(tweet.owner.toString()!==req.user._id.toString()){
        throw new ApiError("unauthorized")
    }
    tweet.content = content
    await tweet.save()

    return res.status(200).json(new ApiResponse(200,tweet, "tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(401,"invalid object id")
    }

    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(401,"tweet not found")
    }

    if(tweet.owner.toString()!==req.user._id.toString()){
        throw new ApiError(401,"unauthorized")
    }

    await tweet.deleteOne()
    return res.status(200).json(new ApiResponse(200, {}, "tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}