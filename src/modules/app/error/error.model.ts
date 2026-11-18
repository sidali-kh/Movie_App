import mongoose, { Schema } from "mongoose";

const errorSchema = new Schema(
  {},
  { timestamps: true },
);

const ErrorModel = mongoose.model(
  "Error",
  errorSchema,
);

export default ErrorModel;
