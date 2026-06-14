// src/routes/mcq.exam.routes.js

import express from "express";
import {
  createMCQExam,
  getAllMCQExams,
  getMCQExam,
  updateMCQExam,
  deleteMCQExam,
} from "../controllers/mcq.exam.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public — anyone can read
router.get("/", getAllMCQExams);
router.get("/:id", getMCQExam);

// Protected
router.post("/", authenticate, createMCQExam);
router.put("/:id", authenticate, updateMCQExam);
router.delete("/:id", authenticate, deleteMCQExam);

export default router;
