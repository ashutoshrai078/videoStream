const asyncHandler = (requestHandler) => {
  return (req,res,next) =>{
    Promise.resolve(requestHandler(req,res,next)).catch((error) => next(error))
  }
}  
// here we've passed a func named request handler or named the func as request handler then we've extracted the req, res, next and passed it to promise

export {asyncHandler}

// const asyncHandler = () => {}
// const asyncHandler = (func) => () =>{}
// const asyncHandler = (func) => async() =>{}

// const asyncHandler = (func) => async(req,res,next) => {
//   try {
//     await func(req,res,next)
//   } catch (error) {
//     res.status(error.code||500).json({
//       success: false,
//       message: error.message
//     })
//   }
// }