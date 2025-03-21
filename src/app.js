import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
const app = express()


app.use(cors({
    origin: process.env.CORS_ORIGIN, //Specifies which origins (domains) are allowed to make cross-origin requests.
    credentials : true 
}))

// what is app.use() : function in Express.js adds middleware to the application’s request-processing pipeline. It applies the specified middleware to all incoming requests or to specific routes, allowing you to modify request/response objects, perform operations, or handle errors throughout the application.

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({
    extended :true, //  allows nested objects in form data. eg : {user : age: 20, name :"manan"}
    limit:"16kb"
}))
app.use(express.static("public")) // agr hm koi file pdf vgera sttore krna chahte hai , to ek public folder bna dete hai k public 
//assest hai , koi bhi use krlo (jo hmne public folder bnaya hai)
// so it is a middleware in Express.js that serves static files .When a request is made for a static file, Express automatically looks for it in the "public" folder.
//Example: If you have public/style.css, you can access it via http://localhost:3000/style.css without needing to define a route.

app.use(cookieParser())

//routes  import 
import userRouter from './routes/user.routes.js'
import videoRouter from "./routes/video.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import healthcheckRouter from "./routes/healthcheck.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

//routes declaration 

app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)
export {app}