import mongoose, { Schema } from "mongoose";

const watchlistSchema = new Schema({
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    film: [
      {
        filmId: {
          type: Schema.Types.ObjectId,
          ref: "Film"
        },
        progressSeconds: {
          type: Number,
          default: 0,
          min: 0,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        lastWatchedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ]
});

const Watchlist = mongoose.model("Watchlist", watchlistSchema);

export default Watchlist;
