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

mcqExamSchema.pre("save", async function (next) {
  try {
    if (!this.slug) {
      const unique = randomBytes(6).toString("hex"); // 12-char hex
      this.slug = `mcq-${Date.now()}-${unique}`;
    }
    next();
  } catch (err) {
    next(err);
  }
});

const MCQExam = mongoose.model("MCQExam", mcqExamSchema);

export default MCQExam;
