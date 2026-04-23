import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js'
import { User } from '../models/user.model.js';
import { upload } from '../middlewares/multer.middleware.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const registerUser = asyncHandler(async (req, res)=>{
    //get user details from frontend
    const {username, email, fullName, password} = req.body
    console.log("email: ",email);
    
    //validate user data - data not empty
    /*if(fullName===""){
        throw new ApiError(400, "full name is required")
    }*/
   if(
    [fullName, email, username, password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400, "all fields are required")
    }

    //check if user already exist: username||email
    const existedUser = User.findOne({
        $or:[
            {email},
            {username}
        ]
    })
    if(existedUser){
        throw new ApiError(409, "user with email or username already exists")
    }

    //required files provided by user or not
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "avatar is mandatory")
    }

    //upload files on cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "avatar file is required")
    }

    //create user object - create entry in DB
    const user = await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url||"",
        email,
        password,
        username: username.toLowerCase()
    })
    //remove password and refreshToken field from response for security reasons
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    //check for user creation
    if(!createdUser){
        throw new ApiError(500, "something went wrong while registering the user")
    }

    
    //if user created return response else error
    return response.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )

})

export {registerUser}