
import type { Types } from "mongoose";

export interface WatchlistFilmInput {
  filmId: string;
  progressSeconds?: number;
  completed?: boolean;
  lastWatchedAt?: Date | string;
}

export interface UpdateWatchlistFilmInput {
  progressSeconds?: number;
  completed?: boolean;
  lastWatchedAt?: Date | string;
}

export interface WatchlistFilmResponse {
  filmId: Types.ObjectId;
  progressSeconds: number;
  completed: boolean;
  lastWatchedAt: Date;
}

export interface WatchlistResponse {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  film: WatchlistFilmResponse[];
}
