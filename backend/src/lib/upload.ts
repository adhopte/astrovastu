import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { HttpError } from "./http.js";

export const planUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

type ImageType = "image/jpeg" | "image/png" | "image/webp";

/** Identify the image by magic bytes rather than trusting the client-supplied mimetype. */
export function sniffImage(buf: Buffer): ImageType | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

const EXT: Record<ImageType, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

export function requireImage(file: Express.Multer.File | undefined): { buf: Buffer; type: ImageType } {
  if (!file) throw new HttpError(400, "Floor plan image is required", "missing_file");
  const type = sniffImage(file.buffer);
  if (!type) throw new HttpError(415, "Only JPEG, PNG or WebP images are supported", "unsupported_media");
  return { buf: file.buffer, type };
}

export function saveImage(buf: Buffer, type: ImageType): string {
  fs.mkdirSync(config.uploadDir, { recursive: true });
  const name = `${randomUUID()}${EXT[type]}`;
  fs.writeFileSync(path.join(config.uploadDir, name), buf);
  return name;
}
