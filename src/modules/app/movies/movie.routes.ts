
import { Router } from "express";

import {
  createMovie,
  getMovies,
  getMovieById,
  updateMovie,
  deleteMovie,
} from "./movie.controller.js";

import { authorize } from "@/middleware/restrictAccess.middleware.js";
import { protect } from "@/middleware/protect.middleware.js";

const router = Router();

// Read movies.
router.get("/", getMovies);
router.get("/:id", getMovieById);

// All routes below require authentication.
router.use(protect);


// Create a movie.
router.post("/", createMovie);

// // Update a movie.
router.patch("/:id", updateMovie);

// // Soft-delete a movie.
router.delete("/:id", deleteMovie);

export default router;
