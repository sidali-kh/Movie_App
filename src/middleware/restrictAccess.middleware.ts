
import type { Request, Response, NextFunction } from "express";

// Restrict access to specified roles.
export const authorize = (...roles: Jwt.JwtPayload["role"][]) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    // 1) Check if the user is authenticated.
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // 2) Check if the user has the required role.
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        message: "You do not have permission to access this resource",
      });
      return;
    }

    next();
  };
};
