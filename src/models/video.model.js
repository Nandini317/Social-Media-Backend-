import mongoose ,{Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const videoSchema = new Schema(
    {
        videoFile : {
            type : String , 
            required :true , 
        } , 
        thumbnail : {
            type : String , 
            required :true , 
        },
        title : {
            type : String , 
            required :true , 
        },
        description: {
            type : String , 
            required :true , 
        },
        duration: {
            type : Number , // from cloudnary (derive) 
            required :true , 
        },
        view:{
            type:Number,
            default : 0 
        },
        ispublished : {
            type : Boolean , 
            default :true , 
        },
        owner :{
            type : Schema.Types.ObjectId , 
            ref : "User"
        }

    }
    ,{timestamps : true }
);

mongoose.plugin(mongooseAggregatePaginate) // A plugin in Mongoose is a reusable function that adds extra features to Mongoose schemas.Adds extra functionalities like pagination, soft delete, timestamps, etc.
//A pagination plugin in Mongoose helps break large datasets into smaller chunks (pages) for easy querying.





export const Video = mongoose.model("Video" , videoSchema)