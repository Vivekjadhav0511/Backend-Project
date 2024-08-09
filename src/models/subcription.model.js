
import mongoose, { Schema } from "mongoose";

const subcriptionSchema = new Schema(
    {
        subcriber: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        Channel: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
    },
    { timestamps: true }
)


export const Subcription = mongoose.model("Subcription", subcriptionSchema)