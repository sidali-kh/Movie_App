import mongoose, { Query, Schema } from "mongoose";

const commentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    movie: {
      type: Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },

    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [2000, "Comment cannot exceed 2000 characters"],
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true } 
  },
);

commentSchema.pre(/^find/, function (this: Query<any, any>) {
  if (this.getOptions().includeDeleted) {
    return;
  }

  this.where({ deletedAt: null });
});

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;