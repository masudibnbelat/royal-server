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

// Auto generate slug

mcqExamSchema.pre("save", async function (next) {
  if (!this.slug) {
    let base = [this.class, this.subject]
      .filter(Boolean)
      .join("-")
      .replace(/\s+/g, "-")
      .toLowerCase();

    // Optional: Make slug more unique
    const random = Date.now().toString(36).slice(-6);
    this.slug = `${base}-${random}`;
  }
  next();
});

const MCQExam = mongoose.model("MCQExam", mcqExamSchema);
export default MCQExam;
