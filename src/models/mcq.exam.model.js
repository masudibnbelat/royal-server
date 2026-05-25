// src/models/mcq.exam.model.js

import mongoose from "mongoose";

const mcqExamSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      unique: true,
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
    // ── Who posted this exam ──────────────────────────────────────
    postedBy: {
      name: { type: String, trim: true, default: "" },
      avatar: { type: String, default: null }, // avatar URL (string only)
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
    const count = await mongoose.models.MCQExam.countDocuments();
    this.slug = `mcq-exam-${count + 1}`;
  }
});

const MCQExam = mongoose.model("MCQExam", mcqExamSchema);

export default MCQExam;
