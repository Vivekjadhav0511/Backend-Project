
import mongoose, { Schema } from "mongoose";


const videoSchema = new Schema(
    {
        videoFile: {               // mongoDb allow us to save as media file but we will Avoid it that create a Load On server 
            type: String,   // Cloudinary Url
            required: true,
        },
        thambnail: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        duration: {     // Cloudinary Url
            type: Number,
            required: true,
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }

    }, { timestamps: true }
)


export const Video = mongoose.model("Video", videoSchema)