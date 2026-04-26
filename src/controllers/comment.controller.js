import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    let { page = 1, limit = 10 } = req.query;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const comments = await Comment.find({ video: videoId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("owner", "username avatar"); // optional but good

    const totalComments = await Comment.countDocuments({ video: videoId });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                comments,
                totalComments,
                currentPage: page,
                totalPages: Math.ceil(totalComments / limit)
            },
            "Comments fetched successfully"
        )
    );
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    });

    return res.status(201).json(
        new ApiResponse(201, comment, "Comment added successfully")
    );
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content cannot be empty");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Only owner can update
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to update this comment");
    }

    comment.content = content;
    await comment.save();

    return res.status(200).json(
        new ApiResponse(200, comment, "Comment updated successfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Only owner can delete
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to delete this comment");
    }

    await comment.deleteOne();

    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    );
});

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }