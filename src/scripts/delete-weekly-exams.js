// Usage:   node delete-weekly-exams.js

import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// ── Cloudinary config ───────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const weeklyExamSchema = new mongoose.Schema(
  {
    slug: String,
    subject: String,
    teacher: String,
    class: String,
    ExamNumber: String,
    images: [
      {
        imageUrl: String,
        publicId: String,
      },
    ],
  },
  { timestamps: true },
);

const WeeklyExam = mongoose.model("WeeklyExam", weeklyExamSchema);

const TARGET_EXAM_NUMBERS = ["14", "১৪"];

async function deleteFromCloudinary(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`  ☁️  Cloudinary delete [${publicId}]: ${result.result}`);
  } catch (err) {
    console.error(`  ⚠️  Cloudinary error [${publicId}]:`, err.message);
  }
}

// ── Main ──────────────────────────────────
async function main() {
  const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!MONGO_URI) {
    console.error("❌  MONGO_URI is not set in environment variables.");
    process.exit(1);
  }

  console.log("🔌  Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✅  Connected.\n");

  // ── 1. Find matching exams ──────────────────────
  const exams = await WeeklyExam.find({
    ExamNumber: { $in: TARGET_EXAM_NUMBERS },
  });

  if (exams.length === 0) {
    console.log(
      "ℹ️  No exams found with ExamNumber 10, 11, or 12. Nothing to delete.",
    );
    await mongoose.disconnect();
    return;
  }

  console.log(`🔍  Found ${exams.length} exam(s) to delete:\n`);
  exams.forEach((e) =>
    console.log(
      `  • _id: ${e._id}  |  ExamNumber: ${e.ExamNumber}  |  Subject: ${e.subject}  |  Class: ${e.class}  |  Slug: ${e.slug}`,
    ),
  );
  console.log();

  // ── 2. Delete Cloudinary images ───────────────────────
  for (const exam of exams) {
    if (exam.images?.length) {
      console.log(
        `🖼️  Deleting ${exam.images.length} image(s) for exam ${exam._id}...`,
      );
      await Promise.all(
        exam.images.map((img) =>
          img.publicId ? deleteFromCloudinary(img.publicId) : Promise.resolve(),
        ),
      );
    }
  }

  // ── 3. Delete from MongoDB ─────────────────
  const ids = exams.map((e) => e._id);
  const result = await WeeklyExam.deleteMany({ _id: { $in: ids } });

  console.log(
    `\n🗑️  Deleted ${result.deletedCount} exam document(s) from MongoDB.`,
  );

  await mongoose.disconnect();
  console.log("\n🔌  Disconnected. Done.");
}

main().catch((err) => {
  console.error("❌  Unexpected error:", err);
  mongoose.disconnect();
  process.exit(1);
});
