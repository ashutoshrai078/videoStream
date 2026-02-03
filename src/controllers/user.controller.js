import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'

const generateAccessAndRefreshTokens = async (userId) => {
    try {
       const user = await User.findById(userId)
       const accessToken = user.generateAccessToken()
       const refreshToken = user.generateRefreshToken()

       user.refreshToken = refreshToken
       await user.save({ validateBeforeSave: false })

       return {refreshToken, accessToken}
    
    } catch (error) {
        throw new ApiError(500, 'something went wrong while generating access and refresh token')
    }
}

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

//  console.log(email); 

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
//  const coverLocalPath  = req.files?.coverImage[0]?.path

let coverLocalPath;
if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverLocalPath = req.files.coverImage[0].path
}

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

 if(!createdUser){
  throw new ApiError(500, 'something went wrong while registering user')
 }

  return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

});

const loginUser = asyncHandler(async (req,res)=>{
    // get data
    // validate data, available or not
    // find user or not
    // check password
    // acess and refresh token generate
    // send cookies
    // send response

    //getting the data
    const {email,username, password} = req.body
    if(!username || !email){
        throw new ApiError(400, 'Atleast Username or Email is required')
    }

    //finding the user in db
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    //validating user 
    if (!user) {
        throw new ApiError(404, 'User does not exist')
    }

    // checking password

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, 'Incorrect Password')
    }

    //generating access and refresh tokens

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password refreshToken")

    // sending cookies
    const options = {
        httpOnly: true,
        secure: true 
    }

    return res.status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            'User logged in successfully'
        )
    )
})

const logoutUser = asyncHandler(async(req,res) => {
    
})

export { registerUser, loginUser }