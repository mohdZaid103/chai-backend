import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos= asyncHandler(async(req,res)=>{
    const {
        page=1,
        limit=10,
        query="",
        sortBy = "createdAt",
        sortType = "desc",
        userId
    } = req.query;

    const matchStage = {
        $match:{
            ...(query&&{
                titel:{$regex:query,$options:"i"}
            }),
            ...(userId&&{
                owner:new mongoose.Types.ObjectId(userId)
            })
        }
    };

    const sortStage={
        $sort:{
            [sortBy]:sortType==="asc"?1:-1
        }
    };
    const aggregate = Video.aggregate([
        matchStage,
        sortStage,
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            fullName:1,
                            email:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$owner"
        }
    ]);
    const options = {
        page:parseInt(page),
        limit:parseInt(limit)
    };

    const videos = await Video.aggregatePaginate(aggregate,options)

    return res.status(200).json(new ApiResponse(200,videos,"videos fetched successfully"))
})

const publishAVideo =asyncHandler(async(req,res)=>{
    const {title,description} = req.body

    if(!title||!description){
        throw new ApiError(401, "title and description are required")
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if(!videoLocalPath||!thumbnailLocalPath){
        throw new ApiError(401, "video and thumbnail are required")
    }

    const videoUpload= await uploadOnCloudinary(videoLocalPath);
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoUpload||!thumbnailUpload){
        throw new ApiError(501, "error while uploading files on cloudinary")
    }

    const video =await Video.create({
        title,
        description,
        videoFile:videoUpload.url,
        thumbnail:thumbnailUpload.url,
        duration: videoUpload.duration,
        owner:req.user._id,
        isPublished:true

    })
    return res.status(200).json(new ApiResponse(200,video, "video uploaded successfully"))
})


const getVideoById =asyncHandler(async(req,res)=>{
    const {videoId} = req.params;
    if(!isValidObjectId(videoId)){
        throw new ApiError(401, "invalid video id")
    }

    const video = await Video.findById(videoId).populate(
        "owner",
        "fullName email avatar"
    )

    if(!video){
        throw new ApiError(404,"video not found")
    }

    return res.status(200).json(new ApiResponse(200, video, "video fetched successfully"))
})

const updateVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    const {title, description} = req.body

    if(!isValidObjectId(videoId)){
        throw new ApiError(401, "invalid video id")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(401, "video not found")
    }

    if(video.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403, "unauthorized")
    }
    if(title) video.title = title
    if(description) video.description = description

    const thumbnailLocalPath = req.file?.path

    if(thumbnailLocalPath){
        const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath)
        video.thumbnail = thumbnailUpload.url
    }

    await video.save()

    return res.status(200).json(new ApiResponse(200, video, "video updated successfully"))
})


const deleteVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(401,"invalid video id")
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"video not found")
    }

    await video.deleteOne();

    return res.status(200).json(new ApiResponse(200,{}, "video deleted successfully" ))
})


const togglePublishStatus = asyncHandler(async(req,res)=>{
    const {videoId}  = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(401,"invalid video id")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "video not found")
    }
    video.isPublished = !video.isPublished

    await video.save()

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "Publish status toggled successfully")
        );
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};