import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import path from "path";
import { ENV } from "../config/env";

const s3 = new S3Client({
  region: ENV.AWS_REGION,
  credentials: {
    accessKeyId: ENV.AWS_ACCESS_KEY_ID,
    secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY,
  },
});

/* =====================================================
   UPLOAD
===================================================== */

export async function uploadToS3(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder = "products"
): Promise<{ key: string; url: string }> {
  const ext = path.extname(originalName).toLowerCase();
  const hash = crypto.randomBytes(8).toString("hex");
  const key = `${folder}/${Date.now()}-${hash}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: ENV.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  const url = `https://${ENV.AWS_S3_BUCKET}.s3.${ENV.AWS_REGION}.amazonaws.com/${key}`;
  return { key, url };
}

/* =====================================================
   DELETE
===================================================== */

export async function deleteFromS3(keyOrUrl: string): Promise<void> {
  try {
    const key = extractKey(keyOrUrl);
    await s3.send(new DeleteObjectCommand({ Bucket: ENV.AWS_S3_BUCKET, Key: key }));
  } catch {
    console.error("Failed to delete S3 object:", keyOrUrl);
  }
}

/* =====================================================
   HELPER — extract S3 key from full URL or return as-is
===================================================== */

export function extractKey(keyOrUrl: string): string {
  const prefix = `https://${ENV.AWS_S3_BUCKET}.s3.${ENV.AWS_REGION}.amazonaws.com/`;
  return keyOrUrl.startsWith(prefix) ? keyOrUrl.slice(prefix.length) : keyOrUrl;
}
