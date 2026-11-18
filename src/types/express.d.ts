import type { Types } from "mongoose";

declare global {
  namespace Express {
    interface AuthUser {
      _id: Types.ObjectId;
      role: "Admin" | "Author" | "Client";
      passwordChangedAt?: Date;
    }

    interface Request {
      user: AuthUser;
    }
  }

}

export {};