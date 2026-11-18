import mongoose, { Schema } from "mongoose";

const ratingSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    film: {
      type: Schema.Types.ObjectId,
      ref: "Film",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      validate: {
        validator: Number.isInteger,
        message: "Rating must be an integer",
      },
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

ratingSchema.index(
  { user: 1, film: 1 },
  { unique: true }
);

const Rating = mongoose.model("Rating", ratingSchema);

export default Rating;