/**
 * pictures フォルダから写真を読み込み、名前→data URL のマッピングを生成するビルドスクリプト
 * 出力: src/data/residentPhotos.json（一覧サムネ） / residentPhotosFull.json（詳細表示用）
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PICTURES_ROOT = path.resolve(__dirname, "../../pictures");
const PICTURES_LOCAL = path.resolve(__dirname, "../pictures");
const PICTURES_DIR = fs.existsSync(PICTURES_ROOT)
  ? PICTURES_ROOT
  : PICTURES_LOCAL;
const OUTPUT_THUMB = path.resolve(__dirname, "../src/data/residentPhotos.json");
const OUTPUT_FULL = path.resolve(__dirname, "../src/data/residentPhotosFull.json");

const MAX_THUMB_PX = 200;
const MAX_FULL_PX = 800;
const JPEG_QUALITY_THUMB = 75;
const JPEG_QUALITY_FULL = 82;
const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp"];

function fullwidthToHalfwidth(str) {
  return str.replace(/[０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0)
  );
}

function removeParentheses(str) {
  return str.replace(/[（(（\[【][^）)）\]】]*[）)）\]】]/g, "").trim();
}

function extractNameKeys(filename) {
  let base = path.basename(filename, path.extname(filename));
  base = base.replace(/^[pP]?\d+\s*/, "");
  base = fullwidthToHalfwidth(base);
  base = removeParentheses(base);
  base = base.replace(/[\s　]+/g, " ").trim();

  const keys = new Set();
  const noSpace = base.replace(/\s/g, "");
  keys.add(noSpace);

  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const [a, b] = parts;
    keys.add(a + b);
    keys.add(b + a);
    keys.add(`${a}　${b}`);
    keys.add(`${b}　${a}`);
  }

  return Array.from(keys);
}

function collectImageFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectImageFiles(fullPath, files);
    } else if (
      IMAGE_EXT.some((ext) => entry.name.toLowerCase().endsWith(ext))
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * @param {Buffer} buffer
 * @param {number} width
 * @param {number} height
 * @param {number} maxSizePx
 * @param {number} quality
 */
async function bufferToJpegDataUrl(buffer, width, height, maxSizePx, quality) {
  let img = sharp(buffer);
  const maxDim = Math.max(width, height);
  if (maxDim > maxSizePx) {
    const scale = maxSizePx / maxDim;
    img = img.resize(
      Math.round(width * scale),
      Math.round(height * scale)
    );
  }
  const out = await img.jpeg({ quality }).toBuffer();
  return `data:image/jpeg;base64,${out.toString("base64")}`;
}

async function buildPhotos() {
  const photoMapThumb = {};
  const photoMapFull = {};
  const imageFiles = collectImageFiles(PICTURES_DIR);

  if (imageFiles.length === 0) {
    console.log(
      `[build-photos] No images found in ${PICTURES_DIR} (folder may not exist)`
    );
  } else {
    for (const filePath of imageFiles) {
      try {
        const buffer = fs.readFileSync(filePath);
        const meta = await sharp(buffer).metadata();
        const { width = 0, height = 0 } = meta;

        if (width === 0 || height === 0) {
          console.warn(`[build-photos] Skip (no size) ${filePath}`);
          continue;
        }

        const thumbUrl = await bufferToJpegDataUrl(
          buffer,
          width,
          height,
          MAX_THUMB_PX,
          JPEG_QUALITY_THUMB
        );
        const fullUrl = await bufferToJpegDataUrl(
          buffer,
          width,
          height,
          MAX_FULL_PX,
          JPEG_QUALITY_FULL
        );

        const nameKeys = extractNameKeys(path.basename(filePath));
        for (const key of nameKeys) {
          if (key) {
            photoMapThumb[key] = thumbUrl;
            photoMapFull[key] = fullUrl;
          }
        }
      } catch (err) {
        console.warn(`[build-photos] Skip ${filePath}:`, err.message);
      }
    }
    console.log(
      `[build-photos] Processed ${imageFiles.length} images → ${Object.keys(photoMapThumb).length} keys (thumb + full)`
    );
  }

  const outDir = path.dirname(OUTPUT_THUMB);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUTPUT_THUMB, JSON.stringify(photoMapThumb), "utf-8");
  fs.writeFileSync(OUTPUT_FULL, JSON.stringify(photoMapFull), "utf-8");
  console.log(`[build-photos] Written to ${OUTPUT_THUMB}`);
  console.log(`[build-photos] Written to ${OUTPUT_FULL}`);
}

buildPhotos().catch((err) => {
  console.error("[build-photos] Error:", err);
  process.exit(1);
});
