import mongoose from "mongoose";
import type { Request, Response, NextFunction } from "express";
import generateToken from "@/utils/generateToken.js";
import User from "./user.model.js";
import type { CreateUserInput, UpdateUserInput } from "./users.types.js";
import bcrypt from "bcryptjs";
import env from "@/config/env.js";
import { createUserSchema } from "./users.validation.js";

type QueryParams = {
  filter?: string;
  sort?: string;
  page?: number;
  limit?: number;
};

type GetRequest = Request<{}, unknown, unknown, QueryParams>;

// GET /api/users?page=1&limit=10
export const getUsers = async (
  req: GetRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

    const query = User.find();
    if (req?.user?.role === "Admin") {
      query.setOptions({ includeDeleted: true });
    }

    const [users, total] = await Promise.all([
      query
        .select("-password")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      User.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      results: users.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
export const getUserById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
      return;
    }

    const user = await User.findOne({
      _id: id,
    })
      .select("-password")
      .lean();

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/users
export const createUser = async (
  req: Request<{}, unknown, CreateUserInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { fullName, email, password, passwordConfirm, phone, role } = req.body;

    const result = createUserSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    if (role === "Admin") {
      res.status(400).json({
        success: false,
        message: "Admin role is reserved for admins only",
      });
      return;
    }

    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
      return;
    }

    // Public registration must not accept a privileged role.
    const user = await User.create({
      fullName,
      email,
      password,
      passwordConfirm,
      phone,
      role,
    });

    const token = generateToken({
      _id: String(user._id),
      email: user.email,
      role: user.role,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    });

    // The password is excluded from the response.
    const userObject = user.toObject();

    const { password: _password, ...safeUser } = userObject;

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id
export const updateUser = async (
  req: Request<{ id: string }, unknown, UpdateUserInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
      return;
    }

    const { fullName, email, phone } = req.body;

    const updates: UpdateUserInput = {};

    if (fullName !== undefined) updates.fullName = fullName;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
      return;
    }

    const user = await User.findOneAndUpdate(
      { _id: id },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id
export const deleteUser = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
      return;
    }

    const user = await User.findOneAndUpdate(
      { _id: id },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).select("_id");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
