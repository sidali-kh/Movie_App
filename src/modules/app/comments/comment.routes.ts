
import { Router } from "express";

import {
  getMovieComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
} from "./comment.controller.js";

// import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes.
router.get("/movie/:movieId", getMovieComments);
router.get("/:id", getCommentById);

// Authenticated routes.
router.post("/", createComment);
router.patch("/:id", updateComment);
router.delete("/:id", deleteComment);

export default router;
