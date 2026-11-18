
import type { Types } from "mongoose";

export type SubscriptionPlan = "Daily" | "Weekly" | "Monthly";

export type SubscriptionStatus =
  | "Pending"
  | "Active"
  | "Expired"
  | "Cancelled";

export interface CreateSubscriptionInput {
  author: string;
  plan: SubscriptionPlan;
}

export interface UpdateSubscriptionInput {
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
  isActive?: boolean;
  expiresAt?: Date | string | null;
}

export interface SubscriptionResponse {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  author: Types.ObjectId;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  isActive: boolean;
  expiresAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
