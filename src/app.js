import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

//all configurations

app.use(cors({
  origin: process.env.CORS_ORIGIN, //which url to be allowed
  credentials: true
}))

app.use(express.json({limit:'16kb'})) 
//when json is coming after form filing we've set limit to it

app.use(express.urlencoded({extended:true, limit:'16kb'})) 
// here we've put limit to data which is coming through url

app.use(express.static("public")) 
// any data which need sto be stored temporarily for that it is used eg. pdf, img,favicon etc

app.use(cookieParser());
//for performing crud ops to users browser cookies securly

//Routes
import userRouter from './routes/user.routes.js'


//routes declartion

app.use('/api/v1/users', userRouter) // here we're sending the control to the router file standard practice when this route will be hit the control pass over

export {app}
