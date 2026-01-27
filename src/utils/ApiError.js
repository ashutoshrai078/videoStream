class ApiError extends Error{
  constructor (
    statusCode,
    message = "something went wrong",
    errors = [],
    stack = ""
  ){
    super(message) // here we'll send the current message to error's message constructor and it will be used from there
    
    this.statusCode = statusCode,
    this.data = null
    this.message = message
    this.success = false
    this.errors = errors

    if(stack){
      this.stack= this.statck
    }else{
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export {ApiError}