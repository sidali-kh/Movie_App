import mongoose from "mongoose";
import type { Request, Response, NextFunction } from "express";

import Movie from "./movie.model.js";
import type { CreateMovieInput, UpdateMovieInput } from "./movie.types.js";

type QueryParams = {
  filter?: string;
  sort?: string;
  page?: number;
  limit?: number;
};

type GetRequest = Request<{}, unknown, unknown, QueryParams>;

// GET /api/movies
// Retrieve movies with pagination.
export const getMovies = async (
  req: GetRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const query = Movie.find();

    if (req?.user?.role === "Admin") {
      query.setOptions({ includeDeleted: true });
    }

    const movies = await query;

    res.status(200).json({
      success: true,
      results: movies.length,
      data: movies,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/movies/:id
// Retrieve a single movie.
export const getMovieById = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid movie ID",
      });
      return;
    }

    const movie = await Movie.findOne({ _id: id }).lean();

    if (!movie) {
      res.status(404).json({
        success: false,
        message: "Movie not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: movie,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/movies
// Create a movie.
export const createMovie = async (
  req: Request<{}, unknown, CreateMovieInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const movieData = {
      ...req.body,
      author: req.user._id,
    };

    const movie = await Movie.create(movieData);

    res.status(201).json({
      success: true,
      message: "Movie created successfully",
      data: movie,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/movies/:id
// Update an existing movie.
export const updateMovie = async (
  req: Request<{ id: string }, unknown, UpdateMovieInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid movie ID",
      });
      return;
    }

    // Never allow clients to update protected fields.
    const {
      author: _author,
      deletedAt: _deletedAt,
      ...updates
    } = req.body as UpdateMovieInput & {
      author?: unknown;
      deletedAt?: unknown;
    };

    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
      return;
    }

    const movie = await Movie.findOne({ _id: id });

    if (!movie) {
      res.status(404).json({
        success: false,
        message: "Movie not found",
      });
      return;
    }

    // const isAdmin = req.user.role === "Admin";
    // const isAuthor = movie.author.equals(req.user._id);

    // if (!isAdmin && !isAuthor) {
    //   res.status(403).json({
    //     success: false,
    //     message: "You are not allowed to update this movie",
    //   });
    //   return;
    // }

    movie.set(updates);
    await movie.save();

    res.status(200).json({
      success: true,
      message: "Movie updated successfully",
      data: movie,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/movies/:id
// Soft-delete a movie.
export const deleteMovie = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid movie ID",
      });
      return;
    }

    const movie = await Movie.findOne({ _id: id });

    if (!movie) {
      res.status(404).json({
        success: false,
        message: "Movie not found",
      });
      return;
    }

    // const isAdmin = req.user.role === "Admin";
    // const isAuthor = movie.author.equals(req.user._id);

    // if (!isAdmin && !isAuthor) {
    //   res.status(403).json({
    //     success: false,
    //     message: "You are not allowed to delete this movie",
    //   });
    //   return;
    // }

    movie.deletedAt = new Date();
    await movie.save();

    res.status(204).json();
  } catch (error) {
    next(error);
  }
};
