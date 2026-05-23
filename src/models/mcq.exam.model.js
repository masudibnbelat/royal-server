// src/models/mcq.exam.model.js
import mongoose from "mongoose";
import { nanoid } from "nanoid";

const mcqExamSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    class: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    examDate: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

mcqExamSchema.pre("save", function (next) {
  if (!this.slug) {
    const base = [this.class, this.subject]
      .filter(Boolean)
      .join("-")
      .replace(/\s+/g, "-");

    this.slug = `${base}-${nanoid(6)}`;
  }

  next();
});

const MCQExam = mongoose.model("MCQExam", mcqExamSchema);

export default MCQExam;
