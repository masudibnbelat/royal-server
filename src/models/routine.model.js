// src/models/routine.model.js
import mongoose from "mongoose";

const routineSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    publicId: {
      type: String,
      required: true,
      unique: true,
    },
    secureUrl: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      default: "pdf",
    },
    totalPages: {
      type: Number,
      required: true,
    },
    originalFilename: {
      type: String,
      default: "",
    },
    bytes: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const Routine = mongoose.model("Routine", routineSchema);
export default Routine;
