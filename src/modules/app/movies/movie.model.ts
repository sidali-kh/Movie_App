import mongoose, { Schema, Query } from "mongoose";

const movieSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Movie title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    description: {
      type: String,
      required: [true, "Movie description is required"],
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },

    poster: {
      type: String,
      required: [true, "Movie poster is required"],
      trim: true,
    },

    video: [
      {
        episode: {
          type: Number,
          required: [true, "Episode number is required"],
          min: [1, "Episode number must be at least 1"],
          validate: {
            validator: Number.isInteger,
            message: "Episode number must be an integer",
          },
        },
        fileUrl: [
          {
            type: String,
            required: [true, "Video file URL is required"],
            trim: true,
          },
        ],
      },
    ],

    language: {
      type: String,
      enum: ["English", "Arabic", "French", "Spanish"],
      required: [true, "Movie language is required"],
    },

    genre: {
      type: [
        {
          type: String,
          enum: [
            "Action",
            "Comedy",
            "Drama",
            "Romance",
            "Thriller",
            "Horror",
            "Adventure",
            "Fantasy",
            "Science Fiction",
            "Animation",
          ],
        },
      ],
      validate: {
        validator: (genres: string[]) => genres.length > 0,
        message: "At least one genre is required",
      },
    },

    subtitles: [
      {
        language: {
          type: String,
          enum: ["English", "Arabic", "French", "Spanish"],
          required: [true, "Subtitle language is required"],
        },

        fileUrl: {
          type: String,
          required: [true, "Subtitle file URL is required"],
          trim: true,
        },
      },
    ],

    releaseYear: {
      type: Number,
      min: [1988, "Invalid release year"],
      max: [
        new Date().getFullYear() + 1,
        "Release year is too far in the future",
      ],
      validate: {
        validator: Number.isInteger,
        message: "Release year must be an integer",
      },
    },

    duration: {
      type: Number,
      required: [true, "Movie duration is required"],
      min: [5 * 60, "Duration must be at least 5 minutes"],
    },

    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Movie author is required"],
    },

    status: {
      type: String,
      enum: ["Draft", "Pending", "Published", "Rejected"],
      default: "Draft",
      required: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

movieSchema.pre(/^find/, function (this: Query<any, any>) {
  if (this.getOptions().includeDeleted) {
    return;
  }

  this.where({ deletedAt: null });
});

const Movie = mongoose.model("Movie", movieSchema);

export default Movie;
