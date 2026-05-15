// src/controllers/routine.controller.js
import Routine from "../models/routine.model.js";
import cloudinary, {
  createSignedPdfUpload,
  deleteFromCloudinary,
} from "../config/cloudinary.js";

const generateRoutineSlug = async () => {
  const date = new Date();
  const base = `routine-${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  let slug = base;
  let count = 1;

  while (await Routine.exists({ slug })) {
    slug = `${base}-${count++}`;
  }

  return slug;
};

// POST /api/routines/sign-upload
export const getRoutineUploadSignature = async (req, res) => {
  try {
    const slug = await generateRoutineSlug();
    const publicId = `routines/${slug}`;

    const signed = createSignedPdfUpload({ publicId });

    return res.status(200).json({
      success: true,
      data: {
        slug,
        ...signed,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate upload signature",
      error: error.message,
    });
  }
};

// POST /api/routines
export const createRoutine = async (req, res) => {
  try {
    const {
      slug,
      publicId,
      secureUrl,
      format = "pdf",
      totalPages,
      originalFilename = "",
      bytes = 0,
    } = req.body;

    if (!slug || !publicId || !secureUrl || !totalPages) {
      return res.status(400).json({
        success: false,
        message: "slug, publicId, secureUrl, totalPages are required",
      });
    }

    const exists = await Routine.findOne({
      $or: [{ slug }, { publicId }],
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Routine already exists",
      });
    }

    // if only one active routine needed
    await Routine.updateMany({ isActive: true }, { $set: { isActive: false } });

    const routine = await Routine.create({
      slug,
      publicId,
      secureUrl,
      format,
      totalPages,
      originalFilename,
      bytes,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Routine created successfully",
      data: routine,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create routine",
      error: error.message,
    });
  }
};

// GET /api/routines
export const getAllRoutines = async (req, res) => {
  try {
    const routines = await Routine.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: routines });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/routines/active
export const getActiveRoutine = async (req, res) => {
  try {
    const routine = await Routine.findOne({ isActive: true }).sort({
      createdAt: -1,
    });

    if (!routine) {
      return res.status(404).json({
        success: false,
        message: "No active routine found",
      });
    }

    return res.status(200).json({ success: true, data: routine });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/routines/:slug
export const getRoutineBySlug = async (req, res) => {
  try {
    const routine = await Routine.findOne({ slug: req.params.slug });

    if (!routine) {
      return res.status(404).json({
        success: false,
        message: "Routine not found",
      });
    }

    return res.status(200).json({ success: true, data: routine });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/routines/:slug
export const deleteRoutine = async (req, res) => {
  try {
    const routine = await Routine.findOne({ slug: req.params.slug });

    if (!routine) {
      return res.status(404).json({
        success: false,
        message: "Routine not found",
      });
    }

    await cloudinary.uploader.destroy(routine.publicId, {
      resource_type: "image",
    });

    await routine.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Routine deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/routines/:slug/toggle
export const toggleRoutineStatus = async (req, res) => {
  try {
    const routine = await Routine.findOne({ slug: req.params.slug });

    if (!routine) {
      return res.status(404).json({
        success: false,
        message: "Routine not found",
      });
    }

    // if turning this one on, turn others off
    if (!routine.isActive) {
      await Routine.updateMany(
        { _id: { $ne: routine._id }, isActive: true },
        { $set: { isActive: false } },
      );
    }

    routine.isActive = !routine.isActive;
    await routine.save();

    return res.status(200).json({
      success: true,
      data: routine,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
