// routes/weekly.exam.routes.js

import express from "express";
import {
  getAllWeeklyExams,
  getWeeklyExamBySlug,
  createWeeklyExam,
  updateWeeklyExam,
  deleteWeeklyExam,
  recordView,
  getWeeklyExamMeta,
  getViewers,
} from "../controllers/weekly.exam.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/").get(getAllWeeklyExams).post(authenticate, createWeeklyExam);

router.get("/meta", getWeeklyExamMeta);
router.get("/by-slug/:slug", getWeeklyExamBySlug);

router.patch("/:id/record-view", authenticate, recordView);
router.get("/:id/viewers", authenticate, getViewers);

router
  .route("/:id")
  .put(authenticate, updateWeeklyExam)
  .delete(authenticate, deleteWeeklyExam);

export default router;
