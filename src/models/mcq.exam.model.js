// src/models/mcq.exam.model.js

import mongoose from "mongoose";
import { randomBytes } from "crypto";

const mcqExamSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      unique: true,
      sparse: true, // ✅ allows null during generation before save
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    examDate: {
      type: Date,
      required: [true, "Exam date is required"],
    },
    postedBy: {
      name: { type: String, trim: true, default: "" },
      avatar: { type: String, default: null },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      role: { type: String, default: null },
    },
  },
  { timestamps: true },
);

mcqExamSchema.pre("save", async function () {
  if (!this.slug) {
    const { randomBytes } = await import("crypto");
    const unique = randomBytes(6).toString("hex");
    this.slug = `mcq-${Date.now()}-${unique}`;
  }
});

const MCQExam = mongoose.model("MCQExam", mcqExamSchema);

export default MCQExam;
