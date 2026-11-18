import type { Types } from "mongoose";

export interface CreateCommentInput {
  film: Types.ObjectId | string;
  comment: string;
}

export interface UpdateCommentInput {
  comment: string;
}