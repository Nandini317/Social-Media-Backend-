import multer from "multer"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) //baad mein krenge 
      cb(null, file.originalname) // file.fieldname + '-' + uniqueSuffix : we can use this later 
    }
  })
  
export  const upload = multer({ storage, })

