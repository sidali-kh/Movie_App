
import { Router } from "express";

import {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
} from "./payment.controller.js";

import {
  protect,
  authorize,
} from "../middlewares/auth.middleware.js";

const router = Router();

// All payment endpoints require authentication.
router.use(protect);

// Users see their own payments; admins can see all.
router.get("/", getPayments);
router.get("/:id", getPaymentById);

// Admin-only administrative operations.
router.patch("/:id", authorize("Admin"), updatePayment);
router.delete("/:id", authorize("Admin"), deletePayment);

// Authenticated users can initiate their own payment flow.
router.post("/", createPayment);

export default router;
