// delete-old-daily-lessons.js
// Deletes DailyLesson documents where `date` is before May 1, 2025
//
// Usage:
//   node delete-old-daily-lessons.js
//
// Prerequisites:
//   npm install mongoose dotenv

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// ── Inline DailyLesson schema (minimal, for the delete op) ────────────────
const dailyLessonSchema = new mongoose.Schema(
  {
    subject: String,
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    teacherSlug: String,
    class: String,
    chapterNumber: String,
    topics: String,
    slug: String,
    date: Date,
    viewCount: Number,
  },
  { timestamps: true },
);

const DailyLesson = mongoose.model("DailyLesson", dailyLessonSchema);

// ── Cutoff: anything BEFORE May 1, 2026 ───────────────────────────────────
const CUTOFF_DATE = new Date("2026-05-01T00:00:00.000Z");

async function main() {
  const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!MONGO_URI) {
    console.error("❌  MONGO_URI is not set in environment variables.");
    process.exit(1);
  }

  console.log("🔌  Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅  Connected.\n");

  // ── 1. Preview matching documents ─────────────────────────────────────
  const lessons = await DailyLesson.find({ date: { $lt: CUTOFF_DATE } })
    .select("_id subject class date createdAt slug")
    .sort({ date: 1 });

  if (lessons.length === 0) {
    console.log("ℹ️  No lessons found before May 2025. Nothing to delete.");
    await mongoose.disconnect();
    return;
  }

  console.log(
    `🔍  Found ${lessons.length} lesson(s) with date before ${CUTOFF_DATE.toDateString()}:\n`,
  );

  lessons.forEach((l) =>
    console.log(
      `  • _id: ${l._id}  |  Date: ${l.date?.toISOString().slice(0, 10)}  |  Subject: ${l.subject}  |  Class: ${l.class}  |  Slug: ${l.slug ?? "-"}`,
    ),
  );

  console.log();

  // ── 2. Delete matching documents ───────────────────────────────────────
  const result = await DailyLesson.deleteMany({ date: { $lt: CUTOFF_DATE } });

  console.log(
    `🗑️  Deleted ${result.deletedCount} lesson document(s) from MongoDB.`,
  );

  await mongoose.disconnect();
  console.log("\n🔌  Disconnected. Done.");
}

main().catch((err) => {
  console.error("❌  Unexpected error:", err);
  mongoose.disconnect();
  process.exit(1);
});
