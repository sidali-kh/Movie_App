import { Router } from "express";

import {
  loginUser,
  logoutUser,
  getMe,
  updateMe,
  deleteMe,
} from "./profile.controller.js";

import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "./users.controller.js";

import { authorize } from "@/middleware/restrictAccess.middleware.js";
import { protect } from "@/middleware/protect.middleware.js";

const router = Router();

// Public registration.
router.post("/register", createUser);
router.post("/login", loginUser);

// Authenticated user
router.use(protect);

router.get("/me", getMe);
router.patch("/me", updateMe);
router.delete("/me", deleteMe);
router.post("/logout", logoutUser);

// Admin-only user management.
router.use(authorize("Admin"));

router.get("/", getUsers);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
