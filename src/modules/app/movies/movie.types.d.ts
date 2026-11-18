
import type { Types } from "mongoose";

export type MovieLanguage = "English" | "Arabic" | "French" | "Spanish";

export type MovieGenre =
  | "Action"
  | "Comedy"
  | "Drama"
  | "Romance"
  | "Thriller"
  | "Horror"
  | "Adventure"
  | "Fantasy"
  | "Science Fiction"
  | "Animation";

export type MovieStatus = "Draft" | "Pending" | "Published" | "Rejected";

export interface MovieVideoInput {
  episode: number;
  fileUrl: string[];
}

export interface MovieSubtitleInput {
  language: MovieLanguage;
  fileUrl: string;
}

export interface CreateMovieInput {
  title: string;
  description: string;
  poster: string;
  video: MovieVideoInput[];
  language: MovieLanguage;
  genre: MovieGenre[];
  subtitles?: MovieSubtitleInput[];
  releaseYear?: number;
  duration: number;
  author: Types.ObjectId;
  status?: MovieStatus;
}

export type UpdateMovieInput = Partial<Omit<CreateMovieInput, "author">>;
