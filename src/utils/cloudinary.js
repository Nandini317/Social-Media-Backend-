import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath){
            return null 
        }
        
        const response = await cloudinary.uploader.upload(localFilePath , {
            resource_type:"auto"
        })
        
        console.log("file has been uploaded on cloudinary" , response.url) ;  
        fs.unlinkSync(localFilePath)
        return {
            url: response.secure_url, // Use secure_url for HTTPS
            duration: response.duration || 0, // Default to 0 if not available
        };
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null ; 
    }
}

export {uploadOnCloudinary}
