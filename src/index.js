//require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
import connectDB from './db/index.js';

// 2nd approach : write the whole connection code in a seperate file(index.js in db) , and call it here ..since this is the main 
// file , it is better approach to firsly import the environment bvariables 
dotenv.config({
    path: './env'
})

connectDB() // this will return a promise 
    .then(() => {
        app.on("error", (error) => {
            console.log("ERROR : ", error);
            throw error
        })
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at port : ${process.env.PORT}`)
        })
    })
    .catch((err) => {
        console.log("MongoDB Connection Failed ! : index.js: ", err)
    })





// 1st approach : every thing in index file : syntax used :function bnao aur immediately call krdo : ( ()=>{} )()

// import express from "express"
// import mongoose from 'mongoose'
// import {DB_NAME} from './constants';
// const app = express()
// (async ()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error" ,(error)=>{
//             console.log("ERROR : " , error);
//             throw error
//         })
//         app.listen(process.env.PORT , ()=>{
//             console.log(`app is listening on post : ${process.env.PORT}`)
//         })
//     } catch (error) {
//         console.error("ERROR : " , error)
//         throw error
//     }
// })()


