// src/routes/mcq.exam.routes.js

import express from "express";
import {
  createMCQExam,
  getAllMCQExams,
  getMCQExam,
  deleteMCQExam,
} from "../controllers/mcq.exam.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllMCQExams);
router.get("/:id", authenticate, getMCQExam);

router.post("/", authenticate, createMCQExam);

router.delete("/:id", authenticate, deleteMCQExam);

export default router;
