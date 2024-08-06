
const asyncHandler = (requestHandler)=>{
    return (req,res,next) =>{
        Promise.resolve(requestHandler(req,res,next))
        .catch((err)=> next(err))
     }
}

export { asyncHandler }





/* 
const asyncHandler = ()=>{}
const asyncHandler = (function)=>{
   async ()=>{
        
    }
} 
    */

/* Async Await  */

/* 
const asyncHandler = (fn)=> async (req,res,next)=>{
    try {
        await fn(req,res,next)
    } catch (error) {
        console.log("Error",error);
        res.status(err.code || 500).json({
            success:false,
            message:err.message
        })
    }
} */