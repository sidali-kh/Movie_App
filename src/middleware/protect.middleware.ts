import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import User from "@/modules/app/users/user.model.js";
import env from "@/config/env.js";

// Verify JWT and authenticate the user.
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // 1. Get the token and check if it exists.
    const authorizationHeader = req.headers.authorization;
    let token : string | undefined;

    if (authorizationHeader?.startsWith("Bearer ")) {
     token = authorizationHeader.slice(7).trim();
    }

    if (!token) {
      res.status(401).json({
        message: "Authentication token is missing",
      });
      return;
    }

    // 2. Verify the token.
    const decoded = jwt.verify(token, env.JWT_SECRET) as Jwt.JwtPayload;

    if (
      typeof decoded !== "object" ||
      typeof decoded._id !== "string" ||
      typeof decoded.iat !== "number" ||
      !mongoose.isValidObjectId(decoded._id)
    ) {
      res.status(401).json({
        message: "Invalid authentication token",
      });
      return;
    }

    // 3. Check whether the user still exists.
    const user = await User.findById(decoded._id)
      .select("_id role passwordChangedAt");

    if (!user) {
      res.status(401).json({
        message: "User not found or account is no longer available",
      });
      return;
    }

    // 4. Check whether the password changed after token issuance.
    if (
      user.passwordChangedAt &&
      user.changedPasswordAfter(decoded.iat)
    ) {
      res.status(401).json({
        message: "Password recently changed. Please log in again.",
      });
      return;
    }

    // 5. Grant access to the protected route.
    req.user = {
      _id: user._id,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        message: "Invalid or expired authentication token",
      });
      return;
    }

    next(error);
  }
};