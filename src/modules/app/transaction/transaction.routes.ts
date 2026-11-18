
import { Router } from "express";

import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "./transaction.controller.js";

import {
  protect,
  authorize,
} from "../middlewares/auth.middleware.js";

const router = Router();

// Every transaction endpoint requires authentication.
router.use(protect);

// Users can view their own transactions.
// Admins can view all transactions.
router.get("/", getTransactions);
router.get("/:id", getTransactionById);

// Restrict financial record mutations to admins.
// In production, transaction creation should normally be
// handled by a trusted payment/balance service.
router.post("/", authorize("Admin"), createTransaction);
router.patch("/:id", authorize("Admin"), updateTransaction);
router.delete("/:id", authorize("Admin"), deleteTransaction);

export default router;
