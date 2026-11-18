
import type { Types } from "mongoose";

export type PaymentStatus =
  | "Pending"
  | "Succeeded"
  | "Failed"
  | "Refunded";

export type PaymentCurrency = "DZD" | "EUR" | "USD";

export interface CreatePaymentInput {
  film: string[];
  amount: number;
  currency?: PaymentCurrency;
}

export interface UpdatePaymentInput {
  receiptUrl?: string;
}

export interface PaymentResponse {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  film: Types.ObjectId[];
  amount: number;
  currency: PaymentCurrency;
  receiptUrl?: string;
  providerReference?: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}
