
import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import Watchlist from "./watchlist.model.js";
import Film from "../movies/movie.model.js";

import type {
  WatchlistFilmInput,
  UpdateWatchlistFilmInput,
} from "./watchlist.types.js";

// Create an empty watchlist for the authenticated user.
export const createWatchlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const existing = await Watchlist.findOne({
      user: req.user._id,
    });

    if (existing) {
      return res.status(409).json({
        message: "A watchlist already exists for this user",
        data: existing,
      });
    }

    const watchlist = await Watchlist.create({
      user: req.user._id,
      film: [],
    });

    return res.status(201).json({
      message: "Watchlist created successfully",
      data: watchlist,
    });
  } catch (error) {
    next(error);
  }
};

// Get the authenticated user's watchlist.
export const getWatchlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const watchlist = await Watchlist.findOne({
      user: req.user._id,
    }).populate("film.filmId");

    if (!watchlist) {
      return res.status(404).json({
        message: "Watchlist not found",
      });
    }

    return res.status(200).json({
      data: watchlist,
    });
  } catch (error) {
    next(error);
  }
};

// Add a film to the user's watchlist.
export const addFilmToWatchlist = async (
  req: Request<{}, unknown, WatchlistFilmInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { filmId, progressSeconds = 0, completed = false } = req.body;

    if (!mongoose.isValidObjectId(filmId)) {
      return res.status(400).json({
        message: "Invalid film ID",
      });
    }

    if (
      typeof progressSeconds !== "number" ||
      !Number.isFinite(progressSeconds) ||
      progressSeconds < 0
    ) {
      return res.status(400).json({
        message: "progressSeconds must be a non-negative number",
      });
    }

    if (typeof completed !== "boolean") {
      return res.status(400).json({
        message: "completed must be a boolean",
      });
    }

    const filmExists = await Film.exists({
      _id: filmId,
      deletedAt: null,
    });

    if (!filmExists) {
      return res.status(404).json({
        message: "Film not found",
      });
    }

    let watchlist = await Watchlist.findOne({
      user: req.user._id,
    });

    if (!watchlist) {
      watchlist = await Watchlist.create({
        user: req.user._id,
        film: [],
      });
    }

    const alreadyAdded = watchlist.film.some(
      (item) => item.filmId?.toString() === filmId
    );

    if (alreadyAdded) {
      return res.status(409).json({
        message: "Film is already in your watchlist",
      });
    }

    watchlist.film.push({
      filmId: new mongoose.Types.ObjectId(filmId),
      progressSeconds,
      completed,
      lastWatchedAt: new Date(),
    });

    await watchlist.save();

    await watchlist.populate("film.filmId");

    return res.status(201).json({
      message: "Film added to watchlist successfully",
      data: watchlist,
    });
  } catch (error) {
    next(error);
  }
};

// Update the viewing progress of a film in the watchlist.
export const updateWatchlistProgress = async (
  req: Request<
    { filmId: string },
    unknown,
    UpdateWatchlistFilmInput
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { filmId } = req.params;
    const { progressSeconds, completed, lastWatchedAt } = req.body;

    if (!mongoose.isValidObjectId(filmId)) {
      return res.status(400).json({
        message: "Invalid film ID",
      });
    }

    if (
      progressSeconds !== undefined &&
      (typeof progressSeconds !== "number" ||
        !Number.isFinite(progressSeconds) ||
        progressSeconds < 0)
    ) {
      return res.status(400).json({
        message: "progressSeconds must be a non-negative number",
      });
    }

    if (
      completed !== undefined &&
      typeof completed !== "boolean"
    ) {
      return res.status(400).json({
        message: "completed must be a boolean",
      });
    }

    if (
      lastWatchedAt !== undefined &&
      (Number.isNaN(new Date(lastWatchedAt).getTime()))
    ) {
      return res.status(400).json({
        message: "Invalid lastWatchedAt date",
      });
    }

    const watchlist = await Watchlist.findOne({
      user: req.user._id,
    });

    if (!watchlist) {
      return res.status(404).json({
        message: "Watchlist not found",
      });
    }

    const item = watchlist.film.find(
      (entry) => entry.filmId?.toString() === filmId
    );

    if (!item) {
      return res.status(404).json({
        message: "Film not found in your watchlist",
      });
    }

    if (progressSeconds !== undefined) {
      item.progressSeconds = progressSeconds;
    }

    if (completed !== undefined) {
      item.completed = completed;
    }

    item.lastWatchedAt =
      lastWatchedAt === undefined
        ? new Date()
        : new Date(lastWatchedAt);

    await watchlist.save();
    await watchlist.populate("film.filmId");

    return res.status(200).json({
      message: "Viewing progress updated successfully",
      data: watchlist,
    });
  } catch (error) {
    next(error);
  }
};

// Remove one film from the watchlist.
export const removeFilmFromWatchlist = async (
  req: Request<{ filmId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { filmId } = req.params;

    if (!mongoose.isValidObjectId(filmId)) {
      return res.status(400).json({
        message: "Invalid film ID",
      });
    }

    const watchlist = await Watchlist.findOne({
      user: req.user._id,
    });

    if (!watchlist) {
      return res.status(404).json({
        message: "Watchlist not found",
      });
    }

    const originalLength = watchlist.film.length;

    watchlist.film = watchlist.film.filter(
      (item) => item.filmId?.toString() !== filmId
    ) as typeof watchlist.film;

    if (watchlist.film.length === originalLength) {
      return res.status(404).json({
        message: "Film not found in your watchlist",
      });
    }

    await watchlist.save();

    return res.status(200).json({
      message: "Film removed from watchlist successfully",
      data: watchlist,
    });
  } catch (error) {
    next(error);
  }
};

// Delete the authenticated user's entire watchlist.
export const deleteWatchlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const watchlist = await Watchlist.findOneAndDelete({
      user: req.user._id,
    });

    if (!watchlist) {
      return res.status(404).json({
        message: "Watchlist not found",
      });
    }

    return res.status(200).json({
      message: "Watchlist deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
