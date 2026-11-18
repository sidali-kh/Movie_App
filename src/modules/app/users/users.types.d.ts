import type { Types, HydratedDocument, Query } from "mongoose";
import User from "./user.model.ts";

export type UserRole = "Admin" | "Author" | "Client";

export interface CreateUserInput {
  fullName: string;
  email: string;
  password: string;
  passwordConfirm: string;
  phone?: string;
  role: UserRole;
}

export type UpdateUserInput = Partial<
  Omit<CreateUserInput, "role", "password", "passwordConfirm">
>;

export interface IUser {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  password: string;
  passwordConfirm?: string;
  passwordChangedAt?: Date | null;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  phone?: string;
  avatar?: string;
  role: UserRole;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMethods {
  changedPasswordAfter(jwtTimestamp: number): boolean;
  correctPassword(
    candidatePassword: string,
    userPassword: string,
  ): Promise<boolean>;
}

export type UserModel = Model<IUser, {}, UserMethods>;

export type UserDocument = HydratedDocument<IUser, UserMethods>;

export interface UserQueryOptions {
  includeDeleted?: boolean;
}

export type UserQuery = Query<
  IUser[],
  IUser,
  {},
  IUser,
  "find",
  UserQueryOptions
>;
