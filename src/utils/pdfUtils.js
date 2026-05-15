// src/utils/pdfUtils.js
import { createCanvas } from "canvas";
import sharp from "sharp";

/* 
  pdfjs-dist legacy build — canvas দিয়ে render করে
  Vercel serverless-এ system binary ছাড়াই কাজ করে
*/
let pdfjsLib;

const getPdfJs = async () => {
  if (pdfjsLib) return pdfjsLib;

  // legacy build ব্যবহার করতে হবে (Node.js compatible)
  const mod = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjsLib = mod;
  return pdfjsLib;
};

/**
 * PDF buffer → [{ buffer: PNGBuffer, pageNumber }]
 * @param {Buffer} pdfBuffer
 * @param {number} scale - render scale (1.5 = ~150dpi equivalent)
 */
export const pdfToImageBuffers = async (pdfBuffer, scale = 2.0) => {
  const pdfjs = await getPdfJs();

  // pdfjs needs Uint8Array
  const uint8 = new Uint8Array(pdfBuffer);

  const loadingTask = pdfjs.getDocument({
    data: uint8,
    // worker source disable (serverless)
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  console.log(`📄 PDF loaded: ${totalPages} pages`);

  const results = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = createCanvas(
      Math.floor(viewport.width),
      Math.floor(viewport.height),
    );
    const context = canvas.getContext("2d");

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    // canvas → PNG buffer (sharp এ দেওয়ার জন্য)
    const pngBuffer = canvas.toBuffer("image/png");

    results.push({ buffer: pngBuffer, pageNumber: pageNum });
    console.log(
      `   ✅ page ${pageNum}/${totalPages} rendered (${Math.floor(viewport.width)}×${Math.floor(viewport.height)})`,
    );
  }

  return results;
};
