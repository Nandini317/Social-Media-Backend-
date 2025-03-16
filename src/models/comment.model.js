import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"
import mongoose ,{Schema} from "mongoose"

const commentSchema = new Schema({} , {timestamps:true }) 

commentSchema.plugin(mongooseAggregatePaginate)
export const Comment = mongoose.model("Comment" ,commentSchema )