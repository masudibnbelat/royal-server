// src/models/mcq.exam.model.js
import mongoose from "mongoose";

const mcqExamSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    class: {
      type: String,
      required: [true, "Class is required"],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
    },
  },
  { timestamps: true },
);

// 🔥 এটা খুব গুরুত্বপূর্ণ — regular function হতে হবে
mcqExamSchema.pre("save", function (next) {
  if (!this.slug) {
    const base = [this.class, this.subject]
      .filter(Boolean)
      .join("-")
      .replace(/\s+/g, "-")
      .toLowerCase();

    const random = Math.random().toString(36).substring(2, 8);
    this.slug = `${base}-${random}`;
  }
  next();
});

const MCQExam = mongoose.model("MCQExam", mcqExamSchema);
export default MCQExam;
