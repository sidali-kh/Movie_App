import { Router } from "express";
import movieRoutes from "@/modules/app/movies/movie.routes.js";
import userRoutes from "@/modules/app/users/users.routes.js";
// import commentRoutes from "@/modules/app/comments/comment.routes.js";
// import ratingRoutes from "@/modules/app/ratings/ratings.routes.js";
// import transactionRoutes from "@/modules/app/transaction/transaction.routes.js";
// import paymentRoutes from "@/modules/app/payment/payment.routes.js";
// import subscriptionRoutes from "@/modules/app/subscription/subscription.routes.js";
// import watchlistRoutes from "@/modules/app/watchlist/watchlist.routes.js";

const router = Router();

router.use("/movies", movieRoutes);
router.use("/users", userRoutes);
// router.use("/comments", commentRoutes);
// router.use("/ratings", ratingRoutes);
// router.use("/transactions", transactionRoutes);
// router.use("/payments", paymentRoutes);
// router.use("/subscriptions", subscriptionRoutes);
// router.use("/watchlist", watchlistRoutes);


export default router;