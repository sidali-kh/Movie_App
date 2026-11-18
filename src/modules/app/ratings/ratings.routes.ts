
import { Router } from "express";

import {
  getFilmRatings,
  getRatingById,
  createRating,
  updateRating,
  deleteRating,
} from "./ratings.controller.js";

import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes.
router.get("/film/:filmId", getFilmRatings);
router.get("/:id", getRatingById);

// Authenticated routes.
router.post("/", protect, createRating);
router.patch("/:id", protect, updateRating);
router.delete("/:id", protect, deleteRating);

export default router;
