// src/config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const toOptimizedWebP = async (buffer) => {
  if (!buffer || buffer.length === 0) {
    throw new Error("Empty buffer");
  }

  return sharp(buffer)
    .rotate()
    .resize(800, 800, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality: 70,
      effort: 4,
    })
    .toBuffer();
};

// existing
export const uploadToCloudinary = async (fileBuffer, folder = "uploads") => {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error("Empty buffer");
  }

  const optimizedBuffer = await toOptimizedWebP(fileBuffer);

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Cloudinary upload timed out after 120s"));
    }, 120000);

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        format: "webp",
      },
      (error, result) => {
        clearTimeout(timeout);
        if (error) return reject(error);
        resolve(result);
      },
    );

    stream.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    stream.end(optimizedBuffer);
  });
};

export const uploadSingleToCloudinary = (file, folder = "uploads") =>
  uploadToCloudinary(file.buffer, folder);

export const deleteFromCloudinary = (publicId) =>
  cloudinary.uploader.destroy(publicId);

const uploadWithRetry = async (fileBuffer, folder, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await uploadToCloudinary(fileBuffer, folder);
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((res) => setTimeout(res, attempt * 1000));
    }
  }
};

export const uploadMultipleToCloudinary = async (files, folder = "uploads") => {
  const results = [];
  for (const file of files) {
    const result = await uploadWithRetry(file.buffer, folder);
    results.push(result);
  }
  return results;
};

// NEW: direct signed upload params for PDF routine upload
export const createSignedPdfUpload = ({ publicId }) => {
  const timestamp = Math.floor(Date.now() / 1000);

  const paramsToSign = {
    timestamp,
    public_id: publicId,
    overwrite: true,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET,
  );

  return {
    timestamp,
    signature,
    publicId,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    overwrite: true,
    uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
  };
};

export default cloudinary;
