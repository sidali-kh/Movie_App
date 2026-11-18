import mongoose, { Schema } from "mongoose";

const paymentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    film: [
      {
        type: Schema.Types.ObjectId,
        ref: "Film",
        unique: true,
      },
    ],

    receiptUrl: {
      type: String,
      required: true,
    },
    
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Succeeded", "Failed", "Refunded"],
      default: "Pending",
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);


const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;