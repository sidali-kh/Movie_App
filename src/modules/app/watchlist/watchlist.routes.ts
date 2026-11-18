
import { Router } from "express";

import {
  createWatchlist,
  getWatchlist,
  addFilmToWatchlist,
  updateWatchlistProgress,
  removeFilmFromWatchlist,
  deleteWatchlist,
} from "./watchlist.controller.js";

import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router
  .route("/")
  .post(createWatchlist)
  .get(getWatchlist)
  .delete(deleteWatchlist);

router.post("/films", addFilmToWatchlist);

router
  .route("/films/:filmId")
  .patch(updateWatchlistProgress)
  .delete(removeFilmFromWatchlist);

export default router;
