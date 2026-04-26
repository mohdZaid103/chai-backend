import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"


// Generic toggle function (reusable)
const toggleLike = async ({ userId, filter }) => {
    const existingLike = await Like.findOne({
        likedBy: userId,
        ...filter
    })

    if (existingLike) {
        await existingLike.deleteOne()
        return { liked: false }
    }

    await Like.create({
        likedBy: userId,
        ...filter
    })

    return { liked: true }
}

//VIDEO LIKE
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const result = await toggleLike({
        userId: req.user._id,
        filter: { video: videoId }
    })

    return res.status(200).json(
        new ApiResponse(200, result, "Video like toggled")
    )
})

//COMMENT LIKE
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    const result = await toggleLike({
        userId: req.user._id,
        filter: { comment: commentId }
    })

    return res.status(200).json(
        new ApiResponse(200, result, "Comment like toggled")
    )
})

//TWEET LIKE
const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    const result = await toggleLike({
        userId: req.user._id,
        filter: { tweet: tweetId }
    })

    return res.status(200).json(
        new ApiResponse(200, result, "Tweet like toggled")
    )
})

//GET LIKED VIDEOS
const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const likedVideos = await Like.find({
        likedBy: userId,
        video: { $ne: null }
    }).populate("video")

    return res.status(200).json(
        new ApiResponse(200, likedVideos, "Liked videos fetched")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}