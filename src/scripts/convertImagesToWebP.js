import "dotenv/config";
import mongoose from "mongoose";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import WeeklyExam from "../src/models/weekly.exam.model.js";

// =====================================================
// CONFIG
// =====================================================
const MONGO_URI = process.env.MONGO_URI;
const WEBP_QUALITY = Number(process.env.WEBP_QUALITY || 82);

// Safety first:
// প্রথমে DRY_RUN=true রেখে test করো
const DRY_RUN = (process.env.DRY_RUN || "true") === "true";

// চাইলে limit দিয়ে test করো
const LIMIT = Number(process.env.MIGRATION_LIMIT || 0);

// যদি true রাখো, পুরনো publicId same রেখে asset overwrite করবে
// এতে DB-র publicId change নাও হতে পারে, শুধু imageUrl update হবে
const OVERWRITE_SAME_PUBLIC_ID = true;

// =====================================================
// CLOUDINARY CONFIG
// =====================================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =====================================================
// STATS
// =====================================================
const stats = {
  scannedDocs: 0,
  updatedDocs: 0,
  totalImages: 0,
  convertedImages: 0,
  skippedMissing: 0,
  skippedAlreadyWebp: 0,
  errors: 0,
  originalBytes: 0,
  webpBytes: 0,
};

// =====================================================
// HELPERS
// =====================================================
const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(2)} ${units[i]}`;
};

const looksLikeWebpUrl = (url = "") => {
  return /\.webp(\?|$)/i.test(url) || /\/f_webp\//i.test(url);
};

const downloadImage = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  }
  const arr = await res.arrayBuffer();
  return Buffer.from(arr);
};

const uploadBufferToCloudinary = (buffer, publicId) =>
  new Promise((resolve, reject) => {
    const options = {
      resource_type: "image",
      format: "webp",
      overwrite: true,
      invalidate: true,
    };

    if (OVERWRITE_SAME_PUBLIC_ID && publicId) {
      options.public_id = publicId;
    }

    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });

    stream.end(buffer);
  });

// =====================================================
// SINGLE IMAGE PROCESSOR
// =====================================================
const processSingleImage = async (img) => {
  if (!img?.imageUrl || !img?.publicId) {
    stats.skippedMissing++;
    return null;
  }

  // যদি already webp-looking URL হয়, চাইলে skip
  // NOTE: এটা asset সত্যিই webp কিনা guarantee দেয় না
  // কিন্তু unnecessary rerun কমায়
  if (looksLikeWebpUrl(img.imageUrl)) {
    stats.skippedAlreadyWebp++;
    return null;
  }

  const originalBuffer = await downloadImage(img.imageUrl);
  stats.originalBytes += originalBuffer.length;

  const webpBuffer = await sharp(originalBuffer)
    .rotate() // EXIF orientation fix
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  stats.webpBytes += webpBuffer.length;

  if (DRY_RUN) {
    return {
      imageUrl: img.imageUrl,
      publicId: img.publicId,
      dryRun: true,
    };
  }

  const uploaded = await uploadBufferToCloudinary(webpBuffer, img.publicId);

  return {
    imageUrl: uploaded.secure_url,
    publicId: uploaded.public_id,
  };
};

// =====================================================
// DOC PROCESSOR
// =====================================================
const processExam = async (exam) => {
  if (!Array.isArray(exam.images) || exam.images.length === 0) {
    return false;
  }

  let changed = false;

  for (let i = 0; i < exam.images.length; i++) {
    stats.totalImages++;

    try {
      const current = exam.images[i];
      const converted = await processSingleImage(current);

      if (converted && !converted.dryRun) {
        exam.images[i].imageUrl = converted.imageUrl;
        exam.images[i].publicId = converted.publicId;
        stats.convertedImages++;
        changed = true;
      } else if (converted?.dryRun) {
        stats.convertedImages++;
      }
    } catch (err) {
      stats.errors++;
      console.error(
        `\n❌ Image convert failed | examId=${exam._id} | index=${i}`,
      );
      console.error(err.message);
    }
  }

  if (changed && !DRY_RUN) {
    exam.markModified("images");
    await exam.save();
    stats.updatedDocs++;
  }

  return changed;
};

// =====================================================
// MAIN
// =====================================================
const run = async () => {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI not found in .env");
  }

  console.log("\n==========================================");
  console.log(" WeeklyExam Cloudinary → WebP Migration");
  console.log("==========================================\n");

  console.log("DRY_RUN:", DRY_RUN);
  console.log("WEBP_QUALITY:", WEBP_QUALITY);
  console.log("LIMIT:", LIMIT || "No limit");
  console.log("");

  await mongoose.connect(MONGO_URI);
  console.log("✅ MongoDB connected");

  const query = { "images.0": { $exists: true } };
  const totalDocs = LIMIT
    ? await WeeklyExam.countDocuments(query).then((n) => Math.min(n, LIMIT))
    : await WeeklyExam.countDocuments(query);

  console.log(`📄 Docs with images: ${totalDocs}\n`);

  let mongooseQuery = WeeklyExam.find(query).sort({ createdAt: 1 });
  if (LIMIT > 0) {
    mongooseQuery = mongooseQuery.limit(LIMIT);
  }

  const cursor = mongooseQuery.cursor();

  for await (const exam of cursor) {
    stats.scannedDocs++;

    try {
      await processExam(exam);
    } catch (err) {
      stats.errors++;
      console.error(`\n❌ Exam processing failed | examId=${exam._id}`);
      console.error(err.message);
    }

    process.stdout.write(
      `\rProcessed docs: ${stats.scannedDocs}/${totalDocs} | ` +
        `Updated: ${stats.updatedDocs} | ` +
        `Images: ${stats.convertedImages}/${stats.totalImages} | ` +
        `Errors: ${stats.errors}`,
    );
  }

  console.log("\n\n========== REPORT ==========");
  console.log("Scanned docs:         ", stats.scannedDocs);
  console.log("Updated docs:         ", stats.updatedDocs);
  console.log("Total images found:   ", stats.totalImages);
  console.log("Converted images:     ", stats.convertedImages);
  console.log("Skipped missing:      ", stats.skippedMissing);
  console.log("Skipped webp-looking: ", stats.skippedAlreadyWebp);
  console.log("Errors:               ", stats.errors);
  console.log("Original total size:  ", formatBytes(stats.originalBytes));
  console.log("WebP total size:      ", formatBytes(stats.webpBytes));
  console.log(
    "Saved:                ",
    formatBytes(Math.max(0, stats.originalBytes - stats.webpBytes)),
  );
  console.log("============================\n");

  await mongoose.disconnect();
  console.log("🔌 MongoDB disconnected\n");
};

run().catch(async (err) => {
  console.error("\n❌ Migration failed");
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
