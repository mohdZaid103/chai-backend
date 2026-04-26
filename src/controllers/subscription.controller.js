import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const subscriberId = req.user._id
    if(!isValidObjectId(channelId)){
        throw new ApiError(401,"invalid channel")
    }

    if(channelId===subscriberId?.toString()){
        throw new ApiError(400,"can't subscribe to own channel")
    }

    const existingSubscription = await Subscription.findOne({
        channel:channelId,
        subscriber:subscriberId
    })
    if(existingSubscription){
        await Subscription.findByIdAndDelete(existingSubscription._id)
        return res.status(200).json(new ApiResponse(200,{},"unsubscribed successfully"))
    }

    const newSubscription = await Subscription.create({
        channel:channelId,
        subscriber:subscriberId
    })
    return res.status(200).json(new ApiResponse(200,newSubscription,"subscriber successfully"))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "invalid channelId")
    }
    const subscribers = await Subscription.find({
        channel:channelId
    }).populate("subscriber", "username email avatar")

    return res.status(200).json(new ApiResponse(200,subscribers,"Channel subscribers fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!isValidObjectId(subscriberId)){
        throw new  ApiError(400,"invalid subscriber id")
    }

    const subscriptions = await Subscription.find({
        subscriber:subscriberId
    }).populate("channel","username email avatar")

    return res.status(200).json(new ApiResponse(200,subscriptions, "subscribed channels fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}