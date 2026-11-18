import { Router } from "express";
import { getErrorList } from "./error.controller.js";

const router = Router();

router.get("/", getErrorList);

export default router;
