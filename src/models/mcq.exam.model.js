// src/models/mcq.exam.model.js
import mongoose from "mongoose";

const mcqExamSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
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

mcqExamSchema.pre("save", function (next) {
  console.log("✅ Pre-save middleware running - Version 2");
  if (!this.slug) {
    let base = [this.class, this.subject]
      .filter(Boolean)
      .join("-")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");

    if (!base) base = "mcq-exam";

    const random = Math.random().toString(36).substring(2, 10);
    this.slug = `${base}-${random}`;
  }
  next();
});

const MCQExam = mongoose.model("MCQExam", mcqExamSchema);
export default MCQExam;
