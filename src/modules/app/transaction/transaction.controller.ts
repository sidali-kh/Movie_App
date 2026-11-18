
import mongoose from "mongoose";
import type { Request, Response, NextFunction } from "express";

import Transaction from "./transaction.model.js";

import type {
  CreateTransactionInput,
  UpdateTransactionInput,
} from "./transaction.types.js";

// GET /api/transactions?page=1&limit=10
export const getTransactions = async (
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

    const isAdmin = req.user.role === "Admin";
    const filter: {
      deletedAt: Date | null;
      user: mongoose.Types.ObjectId | string;
    } = {
      deletedAt: null,
      user: req.user._id,
    };

    // Admins can list transactions for a specific user
    // or omit userId to list all transactions.
    if (isAdmin) {
      if (req.query.userId) {
        if (!mongoose.isValidObjectId(req.query.userId)) {
          res.status(400).json({
            success: false,
            message: "Invalid user ID",
          });
          return;
        }

        filter.user = req.query.userId;
      } else {
        delete (filter as Partial<typeof filter>).user;
      }
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Transaction.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      results: transactions.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/transactions/:id
export const getTransactionById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
      return;
    }

    const filter: {
      _id: string;
      deletedAt: Date | null;
      user?: mongoose.Types.ObjectId;
    } = {
      _id: id,
      deletedAt: null,
    };

    if (req.user.role !== "Admin") {
      filter.user = req.user._id;
    }

    const transaction = await Transaction.findOne(filter).lean();

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/transactions
export const createTransaction = async (
  req: Request<{}, unknown, CreateTransactionInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { operationType, amount } = req.body;

    const transaction = await Transaction.create({
      user: req.user._id,
      operationType,
      amount,
    });

    res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/transactions/:id
export const updateTransaction = async (
  req: Request<{ id: string }, unknown, UpdateTransactionInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
      return;
    }

    // Financial records should not normally be modified.
    // This endpoint is intended only for controlled admin corrections.
    if (req.user.role !== "Admin") {
      res.status(403).json({
        success: false,
        message: "Only admins can update transactions",
      });
      return;
    }

    const updates: UpdateTransactionInput = {};

    if (req.body.operationType !== undefined) {
      updates.operationType = req.body.operationType;
    }

    if (req.body.amount !== undefined) {
      updates.amount = req.body.amount;
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
      return;
    }

    const transaction = await Transaction.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
      return;
    }

    transaction.set(updates);
    await transaction.save();

    res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/transactions/:id
export const deleteTransaction = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
      return;
    }

    // Only admins can perform this controlled soft deletion.
    if (req.user.role !== "Admin") {
      res.status(403).json({
        success: false,
        message: "Only admins can delete transactions",
      });
      return;
    }

    const transaction = await Transaction.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
      return;
    }

    transaction.deletedAt = new Date();
    await transaction.save();

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
