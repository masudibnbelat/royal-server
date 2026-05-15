// src/router/routine.routes.js
import express from "express";
import {
  getRoutineUploadSignature,
  createRoutine,
  getAllRoutines,
  getActiveRoutine,
  getRoutineBySlug,
  deleteRoutine,
  toggleRoutineStatus,
} from "../controllers/routine.controller.js";

const router = express.Router();

// 1) frontend upload er age signed params nibe
router.post("/sign-upload", getRoutineUploadSignature);

// 2) Cloudinary te upload sesh hole metadata save hobe
router.post("/", createRoutine);

// 3) public/admin routes
router.get("/active", getActiveRoutine);
router.get("/", getAllRoutines);
router.get("/:slug", getRoutineBySlug);

// 4) slug-based actions
router.delete("/:slug", deleteRoutine);
router.patch("/:slug/toggle", toggleRoutineStatus);

export default router;
