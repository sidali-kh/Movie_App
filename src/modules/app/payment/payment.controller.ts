
import mongoose from "mongoose";
import type { Request, Response, NextFunction } from "express";

import Payment from "./payment.model.js";
import Film from "../movies/movie.model.js";

import type {
  CreatePaymentInput,
  UpdatePaymentInput,
} from "./payment.types.js";

// GET /api/payments?page=1&limit=10
export const getPayments = async (
  req: Request<
    {},
    unknown,
    unknown,
    { page?: string; limit?: string; userId?: string }
  >,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 10),
    );

    const filter: Record<string, unknown> = {
      deletedAt: null,
    };

    if (req.user.role !== "Admin") {
      filter.user = req.user._id;
    } else if (req.query.userId) {
      if (!mongoose.isValidObjectId(req.query.userId)) {
        res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
        return;
      }

      filter.user = req.query.userId;
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate("user", "fullName email")
        .populate("film", "title poster")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Payment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      results: payments.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/:id
export const getPaymentById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
      return;
    }

    const filter: Record<string, unknown> = {
      _id: id,
      deletedAt: null,
    };

    if (req.user.role !== "Admin") {
      filter.user = req.user._id;
    }

    const payment = await Payment.findOne(filter)
      .populate("user", "fullName email")
      .populate("film", "title poster")
      .lean();

    if (!payment) {
      res.status(404).json({
        success: false,
        message: "Payment not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/payments
export const createPayment = async (
  req: Request<{}, unknown, CreatePaymentInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { film, amount, currency = "DZD" } = req.body;

    if (!Array.isArray(film) || film.length === 0) {
      res.status(400).json({
        success: false,
        message: "At least one film is required",
      });
      return;
    }

    if (film.some((id) => !mongoose.isValidObjectId(id))) {
      res.status(400).json({
        success: false,
        message: "One or more film IDs are invalid",
      });
      return;
    }

    if (new Set(film.map(String)).size !== film.length) {
      res.status(400).json({
        success: false,
        message: "Duplicate film IDs are not allowed",
      });
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({
        success: false,
        message: "Amount must be greater than zero",
      });
      return;
    }

    const films = await Film.find({
      _id: { $in: film },
      deletedAt: null,
    }).select("_id");

    if (films.length !== new Set(film.map(String)).size) {
      res.status(400).json({
        success: false,
        message: "One or more films do not exist",
      });
      return;
    }

    // IMPORTANT:
    // In production, calculate the price on the server.
    // Do not trust the client-supplied amount.
    // This creates a pending record only; it does not charge money.
    const payment = await Payment.create({
      user: req.user._id,
      film,
      amount,
      currency,
      status: "Pending",
    });

    res.status(201).json({
      success: true,
      message: "Pending payment record created",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/payments/:id
// Admin-only receipt correction; payment status is not editable here.
export const updatePayment = async (
  req: Request<{ id: string }, unknown, UpdatePaymentInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (req.user.role !== "Admin") {
      res.status(403).json({
        success: false,
        message: "Only admins can update payment records",
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
      return;
    }

    const { receiptUrl } = req.body;

    if (typeof receiptUrl !== "string" || !receiptUrl.trim()) {
      res.status(400).json({
        success: false,
        message: "A valid receipt URL is required",
      });
      return;
    }

    const payment = await Payment.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { receiptUrl: receiptUrl.trim() } },
      { new: true, runValidators: true },
    );

    if (!payment) {
      res.status(404).json({
        success: false,
        message: "Payment not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Payment receipt updated",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/payments/:id
// Admin-only soft deletion for exceptional administrative cases.
export const deletePayment = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (req.user.role !== "Admin") {
      res.status(403).json({
        success: false,
        message: "Only admins can perform this operation",
      });
      return;
    }

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
      return;
    }

    const payment = await Payment.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    ).select("_id");

    if (!payment) {
      res.status(404).json({
        success: false,
        message: "Payment not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Payment record archived",
    });
  } catch (error) {
    next(error);
  }
};
