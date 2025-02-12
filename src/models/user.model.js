import mongoose , {Schema} from mongoose
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username : {
            type:String , 
            required:true  , 
            unique:true,
            lowercase:true ,
            trim:true , 
            index :true //jb bhi searching field enable krni hai to index:true krna better option hota hai 
        },
        email:{
            type:String , 
            required:true  , 
            unique:true,
            lowercase:true ,
            trim:true , 
        },
        fullName : {
            type:String , 
            required:true  , 
            index:true,
            trim:true , 
        } , 
        avatar:{
            type:String, // cloudnary ka use krenge ..3rd party app hai for uploading data 
            required : true
        } , 
        coverImage : {
            type:String , 
            
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId , 
                ref : "Video"
            }
        ] , 
        password : {
            type:String , 
            required:[true ,'Password is required '  ], 
        } ,
        refreshToken :{
            type:String
        }
        
    },
    {
        timestamps : true 
    }
);

userSchema.pre("save" ,async function (next){ //fnctn should not be an arrow function , as we need the context of "this"
    if(!this.isModified("password")) return next() ; // agr password mein koi changes hi nahi hai to kyu hi update krna baar baar 
    // like if someone changes avatar , then why to again hash the password ?

    this.password = await bcrypt.hash(this.password ,10 ) // hash(kisko krna hai , kitne rounds of salting )
    next()
} )

//ham kuch methods define bhi kr skte hai .. like to check if the password entered by user is correct or not
userSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password , this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign( // (payload , secret key , expiration )
    { //Payload (Data Inside the Token)
        _id:this._id , //unique id 
        email :this.email ,
        username:this.username,
        fullName : this.fullName
    } ,
    process.env.ACCESS_TOKEN_SECRET , //ensures only the server can generate valid tokens.
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }

    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id:this._id ,
        
    } ,
    process.env.REFRESH_TOKEN_SECRET , 
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }

    )
}

export const User = mongoose.model("User" , userSchema);