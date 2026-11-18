
import { Router } from "express";

import {
  createSubscription,
  getSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
} from "./subscription.controller.js";

import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router
  .route("/")
  .get(getSubscriptions)
  .post(createSubscription);

router
  .route("/:id")
  .get(getSubscriptionById)
  .patch(updateSubscription)
  .delete(deleteSubscription);

export default router;
