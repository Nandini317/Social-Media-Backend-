import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
const app = express()


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials : true 
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({
    extended :true, // just for extended objects(nested)
    limit:"16kb"
}))
app.use(express.static("public")) // agr hm koi file pdf vgera sttore krna chahte hai , to ek public folder bna dete hai k public 
//assest hai , koi bhi use krlo (jo hmne public folder bnaya hai)
// so it is a middleware in Express.js that serves static files .When a request is made for a static file, Express automatically looks for it in the "public" folder.
//Example: If you have public/style.css, you can access it via http://localhost:3000/style.css without needing to define a route.

app.use(cookieParser())

export {app}