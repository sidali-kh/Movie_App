import type { Request, Response, NextFunction } from "express";
import generateToken from "@/utils/generateToken.js";
import User from "./user.model.js";
import type { UpdateUserInput } from "./users.types.js";
import bcrypt from "bcryptjs";
import env from "@/config/env.js";


/**
 * Authenticate a user and return a JWT.
 */
export async function loginUser(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
      return;
    }

    // Password has select: false in the User schema.
    const user = await User.findOne({ email }).select("+password");

    if (!user || !user.correctPassword(password, user.password)) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
      return;
    }

    const {_id, role} = user
    const token = generateToken({_id: String(_id), email, role});

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      data: {
        user: user,
      },
    });
  } catch (error: unknown) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "An error occurred during login.",
    });
  }
}

/**
 * Log out the current client.
 *
 * With bearer-token authentication, the client must discard its token.
 * This endpoint alone does not revoke an already-issued JWT.
 */
export async function logoutUser(
  _req: Request,
  res: Response
): Promise<void> {
  res.cookie('token', '', { maxAge: 1 });
  res.status(200).json({
    status: "success",
    message: "Logout successful. Please discard your access token.",
  });
}


export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.user._id).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};


export const updateMe = async (
  req: Request<{}, unknown, UpdateUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fullName, email, phone } = req.body;

    const updates: Partial<UpdateUserInput> = {};

    if (fullName !== undefined) updates.fullName = fullName;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};


export const deleteMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findOneAndUpdate(
      {
        _id: req.user._id,
        deletedAt: null,
      },
      {
        $set: { deletedAt: new Date() },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found or already deleted.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Your account has been deactivated.",
    });
  } catch (error) {
    next(error);
  }
};
