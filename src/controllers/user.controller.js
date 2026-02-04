import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'

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
    if(!username && !email){
        throw new ApiError(400, 'Atleast Username or Email is required')
    }

    /*
    if(!(username || email)){
    throw new jbdjn}  when we want to check for one only
    */ 

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

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

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
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
       httpOnly: true,
       secure: true 
    }

    return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'logout successful'))
})

const refreshAccessToken = asyncHandler(async (req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, 'unauthorized request')
    }

   try {
     const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
     )
     console.log(decodedToken);
     
     const user = await User.findById(decodedToken?._id)
     if (!user) {
         throw new ApiError(401, 'invalid refresh token')
     }
 
     if (incomingRefreshToken !== user?.refreshToken) {
         throw new ApiError(401, 'Refresh token is expired or used')
     }
 
     const options = {
         httpOnly: true,
         secure:true
     }
 
     const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
 
     return res
     .status(200)
     .cookie('accessToken', accessToken,options)
     .cookie('refreshToken', newRefreshToken, options)
     .json(new ApiResponse(
         200,
         {accessToken, refreshToken: newRefreshToken},
         'Access token refreshed'
     )
 )
   } catch (error) {
    throw new ApiError(401, error?.message || 'invalid refresh token')
   }

})

const changePassword = asyncHandler(async(req,res) => {
    const {oldPassword , newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    
    if (!isOldPasswordCorrect) {
        throw new ApiError(400, 'Invalid old passsword')
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json(new ApiResponse(200, {},'Password changed successfully'))

})

const getcurrentUser = asyncHandler(async (req,res) =>{
    return res
    .status(200)
    .json(200, req.user, 'Current user fetched succesfully')
})

const updateAccountdetails = asyncHandler(async (req,res) =>{
    const {fullName , email } = req.body
    if (!fullName || !email) {
        throw new ApiError(400 , 'All fields are required')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set:{
                fullName: fullName,
                email: email
            }
        }, 
        {new:true}).select('-password')

        return res
        .status(200)
        .json(new ApiResponse(200,user, 'Account details updated succesfully'))
})

const updateAvatar = asyncHandler(async(req,res) => {
    const newAvatarLocalPath = req.file?.path
    if (!newAvatarLocalPath) {
        throw new ApiError(400, 'Avatar file is missing')
    }

    const newAvatar = await uploadOnCloudinary(newAvatarLocalPath)

    if (!newAvatar) {
        throw new ApiError(400, 'Error while new avatar uploading')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set : {avatar : newAvatar.url}
        },
        {new : true}
    ).select('-password')

    return res.status(200)
    .json(new ApiResponse(200 ,user, 'Avatar updated successfully'))
})

const updateCoverImage = asyncHandler(async(req,res) => {
    const newcoverImageLocalPath = req.file?.path
    if (!newcoverImageLocalPath) {
        throw new ApiError(400, 'cover Image file is missing')
    }

    const newcoverImage = await uploadOnCloudinary(newcoverImageLocalPath)

    if (!newcoverImage) {
        throw new ApiError(400, 'Error while new avatar uploading')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set : {coverImage : newcoverImage.url}
        },
        {new : true}
    ).select('-password')

    return res.status(200)
    .json(new ApiResponse(200 ,user, 'Cover Image updated successfully'))
})

export { 
    registerUser, 
    loginUser, 
    logoutUser , 
    refreshAccessToken,
    changePassword, 
    getcurrentUser, 
    updateAccountdetails,
    updateAvatar,
    updateCoverImage
}