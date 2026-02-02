import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'


const registerUser = asyncHandler(async (req, res)=>{
 // get user details from frontend
 // validation - not empty
 // check if user already exist : username,email
 // check for images
 // upload them to cloudinary
 // create user object - create entry in db
 // remove password and refresh token field
 // check for user creation
 //return res

 const {username,fullName, email, password} = req.body
 console.log(email);

 if ([username,fullName,email,password].some((field)=>field?.trim === '')) {
  throw new ApiError(400, 'all fields required')
 }
 
 const existuser = await User.findOne({
  $or:[{username}, {email}]
 })

 if(existuser){
  throw new ApiError (409, 'username already exist')
 }

 const avatarLocalPath = req.files?.avatar[0]?.path
 const coverLocalPath  = req.files?.coverImage[0]?.path

 if(!avatarLocalPath){
  throw new ApiError(400, 'avatar is required')
 }

 const avatar = await uploadOnCloudinary(avatarLocalPath)
 const coverImage = await uploadOnCloudinary(coverLocalPath)

 if(!avatar){
  throw new ApiError(400, 'avatar is required')
 }

  const user = await User.create({
  fullName,
  avatar: avatar.url,
  coverImage: coverImage?.url || '',
  email,
  password,
  username
 })

 const createdUser = await User.findById(user._id).select(
  '-password -refreshToken'
 )
console.log(createdUser)

 if(!createdUser){
  throw new ApiError(500, 'something went wrong while registering user')
 }

  return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})

export { registerUser }