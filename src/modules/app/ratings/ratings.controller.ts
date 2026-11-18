
import mongoose from "mongoose";
import type { Request, Response, NextFunction } from "express";

import Rating from "./rating.model.js";
import Film from "../movies/movie.model.js";

import type {
  CreateRatingInput,
  UpdateRatingInput,
} from "./rating.types.js";

// GET /api/ratings/film/:filmId?page=1&limit=10
export const getFilmRatings = async (
  req: Request<
    { filmId: string },
    unknown,
    unknown,
    { page?: string; limit?: string }
  >,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { filmId } = req.params;

    if (!mongoose.isValidObjectId(filmId)) {
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
      film: filmId,
      deletedAt: null,
    };

    const [ratings, total, summary] = await Promise.all([
      Rating.find(filter)
        .populate("user", "fullName")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Rating.countDocuments(filter),

      Rating.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalRatings: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.status(200).json({
      success: true,
      results: ratings.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        averageRating: summary[0]?.averageRating ?? 0,
        totalRatings: summary[0]?.totalRatings ?? 0,
      },
      data: ratings,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/ratings/:id
export const getRatingById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid rating ID",
      });
      return;
    }

    const rating = await Rating.findOne({
      _id: id,
      deletedAt: null,
    })
      .populate("user", "fullName")
      .populate("film", "title poster")
      .lean();

    if (!rating) {
      res.status(404).json({
        success: false,
        message: "Rating not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: rating,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/ratings
export const createRating = async (
  req: Request<{}, unknown, CreateRatingInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { film, rating: ratingValue } = req.body;

    if (!mongoose.isValidObjectId(film)) {
      res.status(400).json({
        success: false,
        message: "Invalid film ID",
      });
      return;
    }

    const existingFilm = await Film.exists({
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

    // Check for an existing active rating.
    const existingRating = await Rating.findOne({
      user: req.user._id,
      film,
      deletedAt: null,
    }).lean();

    if (existingRating) {
      res.status(409).json({
        success: false,
        message: "You have already rated this film. Update your existing rating.",
      });
      return;
    }

    const createdRating = await Rating.create({
      user: req.user._id,
      film,
      rating: ratingValue,
    });

    res.status(201).json({
      success: true,
      message: "Rating created successfully",
      data: createdRating,
    });
  } catch (error) {
    // Concurrent requests can both pass the existence check.
    // The unique index is the final protection against duplicates.
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      res.status(409).json({
        success: false,
        message: "You have already rated this film",
      });
      return;
    }

    next(error);
  }
};

// PATCH /api/ratings/:id
export const updateRating = async (
  req: Request<{ id: string }, unknown, UpdateRatingInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid rating ID",
      });
      return;
    }

    const existingRating = await Rating.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!existingRating) {
      res.status(404).json({
        success: false,
        message: "Rating not found",
      });
      return;
    }

    const isAdmin = req.user.role === "Admin";
    const isOwner = existingRating.user.equals(req.user._id);

    if (!isAdmin && !isOwner) {
      res.status(403).json({
        success: false,
        message: "You are not allowed to update this rating",
      });
      return;
    }

    existingRating.rating = req.body.rating;
    await existingRating.save();

    res.status(200).json({
      success: true,
      message: "Rating updated successfully",
      data: existingRating,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/ratings/:id
export const deleteRating = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid rating ID",
      });
      return;
    }

    const existingRating = await Rating.findOne({
      _id: id,
      deletedAt: null,
    });

    if (!existingRating) {
      res.status(404).json({
        success: false,
        message: "Rating not found",
      });
      return;
    }

    const isAdmin = req.user.role === "Admin";
    const isOwner = existingRating.user.equals(req.user._id);

    if (!isAdmin && !isOwner) {
      res.status(403).json({
        success: false,
        message: "You are not allowed to delete this rating",
      });
      return;
    }

    existingRating.deletedAt = new Date();
    await existingRating.save();

    res.status(200).json({
      success: true,
      message: "Rating deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
