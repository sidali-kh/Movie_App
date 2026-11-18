
import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import Subscription from "./subscription.model.js";
import User from "../users/user.model.js";

import type {
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
} from "./subscription.types.js";

// Create a subscription for the authenticated user.
export const createSubscription = async (
  req: Request<{}, unknown, CreateSubscriptionInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { author, plan } = req.body;

    if (!mongoose.isValidObjectId(author)) {
      return res.status(400).json({ message: "Invalid author ID" });
    }

    if (!["Daily", "Weekly", "Monthly"].includes(plan)) {
      return res.status(400).json({ message: "Invalid subscription plan" });
    }

    const authorExists = await User.exists({
      _id: author,
      deletedAt: null,
    });

    if (!authorExists) {
      return res.status(404).json({ message: "Author not found" });
    }

    const subscription = await Subscription.create({
      user: req.user._id,
      author,
      plan,
      status: "Pending",
      isActive: false,
    });

    return res.status(201).json({
      message: "Subscription created successfully",
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

// List subscriptions.
// Regular users see their own; admins can optionally filter by userId.
export const getSubscriptions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      deletedAt: null,
    };

    if (req.user.role === "Admin") {
      if (req.query.userId) {
        if (!mongoose.isValidObjectId(req.query.userId)) {
          return res.status(400).json({ message: "Invalid user ID" });
        }

        filter.user = req.query.userId;
      }

      if (req.query.authorId) {
        if (!mongoose.isValidObjectId(req.query.authorId)) {
          return res.status(400).json({ message: "Invalid author ID" });
        }

        filter.author = req.query.authorId;
      }
    } else {
      filter.user = req.user._id;
    }

    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter)
        .populate("user", "fullName email")
        .populate("author", "fullName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Subscription.countDocuments(filter),
    ]);

    return res.status(200).json({
      data: subscriptions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get one subscription.
export const getSubscriptionById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid subscription ID" });
    }

    const filter: Record<string, unknown> = {
      _id: id,
      deletedAt: null,
    };

    if (req.user.role !== "Admin") {
      filter.user = req.user._id;
    }

    const subscription = await Subscription.findOne(filter)
      .populate("user", "fullName email")
      .populate("author", "fullName");

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    return res.status(200).json({ data: subscription });
  } catch (error) {
    next(error);
  }
};

// Update a subscription.
// Admins can update its fields; users can cancel their own subscription.
export const updateSubscription = async (
  req: Request<{ id: string }, unknown, UpdateSubscriptionInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid subscription ID" });
    }

    const subscription = await Subscription.findOne({
      _id: id,
      deletedAt: null,
      ...(req.user.role === "Admin" ? {} : { user: req.user._id }),
    });

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    if (req.user.role !== "Admin") {
      // Users may cancel their own subscriptions, but cannot activate them.
      if (
        req.body.status !== "Cancelled" ||
        Object.keys(req.body).some((key) => key !== "status")
      ) {
        return res.status(403).json({
          message: "You may only cancel your own subscription",
        });
      }

      subscription.status = "Cancelled";
      subscription.isActive = false;
    } else {
      const { plan, status, isActive, expiresAt } = req.body;

      if (
        plan !== undefined &&
        !["Daily", "Weekly", "Monthly"].includes(plan)
      ) {
        return res.status(400).json({ message: "Invalid subscription plan" });
      }

      if (
        status !== undefined &&
        !["Pending", "Active", "Expired", "Cancelled"].includes(status)
      ) {
        return res.status(400).json({ message: "Invalid subscription status" });
      }

      if (isActive !== undefined && typeof isActive !== "boolean") {
        return res.status(400).json({ message: "isActive must be a boolean" });
      }

      if (
        expiresAt !== undefined &&
        expiresAt !== null &&
        Number.isNaN(new Date(expiresAt).getTime())
      ) {
        return res.status(400).json({ message: "Invalid expiration date" });
      }

      if (plan !== undefined) subscription.plan = plan;
      if (status !== undefined) subscription.status = status;
      if (isActive !== undefined) subscription.isActive = isActive;
      if (expiresAt !== undefined) {
        subscription.expiresAt =
          expiresAt === null ? null : new Date(expiresAt);
      }
    }

    await subscription.save();

    return res.status(200).json({
      message: "Subscription updated successfully",
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};

// Soft-delete a subscription.
export const deleteSubscription = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid subscription ID" });
    }

    const filter: Record<string, unknown> = {
      _id: id,
      deletedAt: null,
    };

    if (req.user.role !== "Admin") {
      filter.user = req.user._id;
    }

    const subscription = await Subscription.findOneAndUpdate(
      filter,
      { $set: { deletedAt: new Date() } },
      { new: true, runValidators: true }
    );

    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    return res.status(200).json({
      message: "Subscription deleted successfully",
      data: subscription,
    });
  } catch (error) {
    next(error);
  }
};
