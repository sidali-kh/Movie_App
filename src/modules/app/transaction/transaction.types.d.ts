
import type { Types } from "mongoose";

export type OperationType = "Deposit" | "Withdraw";

export interface CreateTransactionInput {
  operationType: OperationType;
  amount: number;
}

export interface UpdateTransactionInput {
  operationType?: OperationType;
  amount?: number;
}

export interface TransactionResponse {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  operationType: OperationType;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}
