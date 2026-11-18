import mongoose, { Schema } from "mongoose";

const transactionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    operationType: {
      type: String,
      required: true,
      enum: ["Deposit", "Withdraw"],
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    createdAt : {
      type: Date,
      default: Date.now,
    },

    deletedAt: {
      type: Date,
      default: null,
    }
  }
);

const Transaction = mongoose.model("Balance", transactionSchema);

export default Transaction;
