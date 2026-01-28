import multer from 'multer'

const storage = multer.diskStorage({
  destination: function (req,file,cb){ // here we've told the destination where file will be stored temporarily on our server
    cb(null, './public/temp')
  },
  filename: function(req,res,cb){ // this is used to modify the filename while saving it usually we should modify it to avoid any overwrite issues but here we're saving it with original name because it will be on server for very tiny time.
    cb(null, file.originalname)
  }
})

export const upload = multer({storage})