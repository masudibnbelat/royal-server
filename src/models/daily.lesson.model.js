// src/models/daily.lesson.model.js

import mongoose from "mongoose";

const dailyLessonSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teacherSlug: { type: String, trim: true, default: null },
    class: { type: String, required: true, trim: true },
    mark: { type: Number, default: 0 },
    referenceType: {
      type: String,
      enum: ["chapter", "page"],
      default: "chapter",
    },
    chapterNumber: { type: String, trim: true },
    topics: { type: String, required: true, minlength: 5, trim: true },
    slug: { type: String, trim: true, default: null },
    date: { type: Date, required: true, default: Date.now },
    viewCount: { type: Number, default: 0 },
    viewedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

dailyLessonSchema.index({ date: 1 });
dailyLessonSchema.index({ date: 1, class: 1 });
dailyLessonSchema.index({ teacherSlug: 1 });

const DailyLesson = mongoose.model("DailyLesson", dailyLessonSchema);
export default DailyLesson;
