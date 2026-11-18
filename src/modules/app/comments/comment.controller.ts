
import mongoose from "mongoose";
import type { Request, Response, NextFunction } from "express";

import Comment from "./comment.model.js";
import Movie from "../movies/movie.model.js";

import type {
  CreateCommentInput,
  UpdateCommentInput,
} from "./comment.types.js";

// GET /api/comments/film/:filmId?page=1&limit=10
export const getMovieComments = async (
  req: Request<
    { movieId: string },
    unknown,
    unknown,
    { page?: string; limit?: string }
  >,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { movieId } = req.params;

    if (!mongoose.isValidObjectId(movieId)) {
      res.status(400).json({
        success: false,
        message: "Invalid film ID",
      });
      return;
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(req.query.limit) || 10),
    );

    const filter = {
      film: movieId,
      deletedAt: null,
    };

    const [comments, total] = await Promise.all([
      Comment.find(filter)
        .populate("user", "fullName")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Comment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      results: comments.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/comments/:id
export const getCommentById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid comment ID",
      });
      return;
    }

    const comment = await Comment.findOne({
      _id: id,
      deletedAt: null,
    })
      .populate("user", "fullName")
      .populate("film", "title poster")
      .lean();

    if (!comment) {
      res.status(404).json({
        success: false,
        message: "Comment not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/comments
export const createComment = async (
  req: Request<{}, unknown, CreateCommentInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { film, comment: commentText } = req.body;

    if (!mongoose.isValidObjectId(film)) {
      res.status(400).json({
        success: false,
        message: "Invalid film ID",
      });
      return;
    }

    const existingFilm = await Movie.exists({
      _id: film,
      deletedAt: null,
    });

    if (!existingFilm) {
      res.status(404).json({
        success: false,
        message: "Film not found",
      });
      return;
    }

    const createdComment = await Comment.create({
      user: req.user._id,
      movie,
      comment: commentText,
    });

    const populatedComment = await Comment.findById(createdComment._id)
      .populate("user", "fullName")
      .populate("film", "title poster")
      .lean();

    res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: populatedComment,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/comments/:id
export const updateComment = async (
  req: Request<{ id: string }, unknown, UpdateCommentInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { comment: commentText } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid comment ID",
      });
      return;
    }

    const existingComment = await Comment.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!existingComment) {
      res.status(404).json({
        success: false,
        message: "Comment not found",
      });
      return;
    }

    const isAdmin = req.user.role === "Admin";
    const isOwner = existingComment.user.equals(req.user._id);

    if (!isAdmin && !isOwner) {
      res.status(403).json({
        success: false,
        message: "You are not allowed to update this comment",
      });
      return;
    }

    existingComment.comment = commentText;
    await existingComment.save();

    const updatedComment = await Comment.findById(existingComment._id)
      .populate("user", "fullName")
      .populate("film", "title poster")
      .lean();

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: updatedComment,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/comments/:id
export const deleteComment = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid comment ID",
      });
      return;
    }

    const comment = await Comment.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!comment) {
      res.status(404).json({
        success: false,
        message: "Comment not found",
      });
      return;
    }

    const isAdmin = req.user.role === "Admin";
    const isOwner = comment.user.equals(req.user._id);

    if (!isAdmin && !isOwner) {
      res.status(403).json({
        success: false,
        message: "You are not allowed to delete this comment",
      });
      return;
    }

    comment.deletedAt = new Date();
    await comment.save();

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
