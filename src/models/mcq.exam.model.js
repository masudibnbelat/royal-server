// src/models/mcq.exam.model.js

import mongoose from "mongoose";

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

// ✅ Use a robust random suffix to avoid collisions
mcqExamSchema.pre("save", async function (next) {
  try {
    if (!this.slug) {
      // Use timestamp + random suffix for uniqueness
      const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      this.slug = `mcq-exam-${suffix}`;
    }
    next();
  } catch (err) {
    next(err); // ✅ Pass error to Mongoose so it surfaces properly
  }
});

const MCQExam = mongoose.model("MCQExam", mcqExamSchema);

export default MCQExam;
