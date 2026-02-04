import { Router } from 'express'
import {upload} from '../middlewares/multer.middleware.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { 
  changePassword, 
  getCurrentUser, 
  getUserChannelProfile, 
  loginUser, 
  logoutUser, 
  refreshAccessToken, 
  registerUser, 
  updateAccountdetails, 
  updateAvatar, 
  updateCoverImage, 
  userWatchHistory} from '../controllers/user.controller.js'

const router = Router()

router.route('/register').post(
  upload.fields([
    {
      name : "avatar",
      maxCount:1
    },
    {
      name: "coverImage",
      maxCount:1
    }
  ]),
  registerUser
)

router.route('/login').post(loginUser)

//Secured routes

router.route('/logout').post(verifyJWT, logoutUser)

router.route('/refresh-token').post(refreshAccessToken)

router.route('/change-password').post(verifyJWT, changePassword)

router.route('/current-user').get(verifyJWT, getCurrentUser)

router.route('/update-account').patch(updateAccountdetails)

router.route('/update-avatar').patch(verifyJWT,upload.single('avatar'), updateAvatar)

router.route('/update-cover').patch(verifyJWT, upload.single('cover-image'), updateCoverImage)

router.route('/c/:username').get(verifyJWT, getUserChannelProfile)

router.route('/watchHistory').get(verifyJWT, userWatchHistory)



export default router

