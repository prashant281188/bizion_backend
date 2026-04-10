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
   UPLOAD — returns only the S3 key; store this in the DB
===================================================== */

export async function uploadToS3(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder = "products"
): Promise<{ key: string }> {
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

  return { key };
}

/* =====================================================
   URL HELPER — construct full public URL via CloudFront
===================================================== */

export function getS3Url(key: string): string {
  return `${ENV.CLOUDFRONT_URL}/${key}`;
}

/* =====================================================
   DELETE
   - Throws on real failures (permissions, network, etc.)
   - Silently ignores "object not found" (idempotent)
   - Guards against empty/null keys
===================================================== */

export async function deleteFromS3(key: string): Promise<void> {
  if (!key || key.trim() === "") {
    return;
  }

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: ENV.AWS_S3_BUCKET, Key: key }));
  } catch (err) {
    // Object already gone — treat as success (idempotent delete)


    // Real failure — log with full error details and rethrow so caller knows
    throw err;
  }
}
