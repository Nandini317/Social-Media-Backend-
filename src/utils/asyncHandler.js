// this is just a utility function to connect and talk with database ..as it is a repetitive task 
// Two ways : 
//              1. Try...catch
//              2.  Promises


const asyncHandler = (requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}

export {asyncHandler}



// const asyncHandler = ()=>{}
// const asyncHandler = (func) =>{()=>{}}
// const asyncHandler = (func) => ()=>{} 

// const asyncHandler = (fn) => async(req, res, next)=>{
//     try {
//         await fn(req, res, next){

//         }
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success:false ,
//             message : error.message
//         })
//     }
// }
