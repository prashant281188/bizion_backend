/**
 * services/gstService.ts
 * ──────────────────────
 * Core service that:
 *   1. Opens a cookie-based HTTP session with the GST portal
 *   2. Downloads & pre-processes the captcha image
 *   3. Runs Tesseract OCR to extract the captcha text
 *   4. Submits GSTIN + captcha to the portal search API
 *   5. Retries automatically on wrong captcha (up to MAX_RETRIES)
 *   6. Returns a normalised GSTDetails object
 */

import axios, { AxiosResponse, AxiosError, RawAxiosResponseHeaders } from "axios";
import Jimp from "jimp";
import { createWorker, Worker } from "tesseract.js";
import {
  GSTDetails,
  PortalRawResponse,
  AddressComponents,
  ApiError,
} from "../types/gst";

// ── Constants ────────────────────────────────────────────────────────────────

const BASE_URL    = "https://services.gst.gov.in/services";
const CAPTCHA_URL = `${BASE_URL}/captcha`;
const SEARCH_URL  = `${BASE_URL}/api/search/taxpayerDetails`;
const MAX_RETRIES = 5;
const TIMEOUT_MS  = 15_000;

const COMMON_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
    "AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-IN,en;q=0.9",
  "Referer":         "https://services.gst.gov.in/services/searchtp",
  "Origin":          "https://services.gst.gov.in",
};

// ── GSTIN Validation ─────────────────────────────────────────────────────────

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function validateGSTIN(gstin: string): string | null {
  if (!gstin) return "GSTIN is required.";
  if (!GSTIN_REGEX.test(gstin))
    return "Invalid GSTIN format. Must be 15 characters (e.g. 27AAPFU0939F1ZV).";
  return null; // valid
}

// ── Tesseract Worker (singleton) ─────────────────────────────────────────────

let _worker: Worker | null = null;

async function getWorker(): Promise<Worker> {
  if (_worker) return _worker;

  _worker = await createWorker("eng", 1, {
    logger: (): void => {}, // silence verbose progress logs
  });

  await _worker.setParameters({
    // Restrict to alphanumeric – GST captcha never has special chars
    tessedit_char_whitelist:
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  });

  return _worker;
}

/** Call this on graceful shutdown to release the Tesseract worker. */
export async function destroyWorker(): Promise<void> {
  if (_worker) {
    await _worker.terminate();
    _worker = null;
  }
}

// ── Image Pre-processing ─────────────────────────────────────────────────────

/**
 * Pre-process a raw captcha image buffer to improve OCR accuracy:
 *   • Greyscale          → removes color noise
 *   • Contrast +50%      → sharpens character edges
 *   • Threshold @ 128    → binarise (pure black/white)
 *   • Blur radius 1      → removes single-pixel noise
 *   • Scale ×3           → enlarges for better Tesseract recognition
 *
 * @param rawBuffer  Raw image bytes from the GST portal
 * @returns          PNG buffer ready for OCR
 */
async function preprocessCaptcha(rawBuffer: Buffer): Promise<Buffer> {
  const image = await Jimp.read(rawBuffer);

  image
    .greyscale()
    .contrast(0.5)
    .threshold({ max: 128 })
    .blur(1)
    .scale(3);

  return image.getBufferAsync(Jimp.MIME_PNG);
}

// ── Cookie-aware HTTP Session ─────────────────────────────────────────────────

interface Session {
  get(url: string, extraHeaders?: Record<string, string>): Promise<AxiosResponse<Buffer>>;
  post(url: string, data: unknown, extraHeaders?: Record<string, string>): Promise<AxiosResponse<PortalRawResponse>>;
}

function parseCookies(
  cookieJar: Map<string, string>,
  headers: RawAxiosResponseHeaders | Partial<Record<string, string | string[]>>
): void {
  const raw = headers["set-cookie"];
  const cookies: string[] = Array.isArray(raw) ? raw : raw ? [raw as string] : [];

  for (const cookie of cookies) {
    const [pair] = cookie.split(";");
    const eqIdx = pair.indexOf("=");
    if (eqIdx === -1) continue;
    const name  = pair.slice(0, eqIdx).trim();
    const value = pair.slice(eqIdx + 1).trim();
    if (name) cookieJar.set(name, value);
  }
}

function cookieHeader(jar: Map<string, string>): string {
  return Array.from(jar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function createSession(): Promise<Session> {
  const jar = new Map<string, string>();

  // Seed session – visit the public search page to acquire portal cookies
  try {
    const seed = await axios.get<Buffer>(`${BASE_URL}/searchtp`, {
      headers: COMMON_HEADERS,
      timeout: TIMEOUT_MS,
      validateStatus: () => true,
    });
    parseCookies(jar, seed.headers);
  } catch {
    // Non-fatal – continue without seed cookies
  }

  return {
    async get(url, extraHeaders = {}): Promise<AxiosResponse<Buffer>> {
      const resp = await axios.get<Buffer>(url, {
        headers: {
          ...COMMON_HEADERS,
          Cookie: cookieHeader(jar),
          ...extraHeaders,
        },
        responseType: "arraybuffer",
        timeout: TIMEOUT_MS,
      });
      parseCookies(jar, resp.headers);
      return resp;
    },

    async post(url, data, extraHeaders = {}): Promise<AxiosResponse<PortalRawResponse>> {
      const resp = await axios.post<PortalRawResponse>(url, data, {
        headers: {
          ...COMMON_HEADERS,
          "Content-Type": "application/json",
          Cookie: cookieHeader(jar),
          ...extraHeaders,
        },
        timeout: TIMEOUT_MS,
      });
      parseCookies(jar, resp.headers);
      return resp;
    },
  };
}

// ── Captcha Fetch + OCR ───────────────────────────────────────────────────────

interface CaptchaResult {
  text: string;
  confidence: number;
}

async function solveCaptcha(session: Session): Promise<CaptchaResult> {
  // 1. Fetch captcha image from portal
  const captchaResp = await session.get(CAPTCHA_URL);
  const rawBuffer = Buffer.from(captchaResp.data as unknown as ArrayBuffer);

  // 2. Pre-process for better OCR
  const cleanBuffer = await preprocessCaptcha(rawBuffer);

  // 3. Run OCR
  const worker = await getWorker();
  const { data } = await worker.recognize(cleanBuffer);

  const text = data.text
    .replace(/\s+/g, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .trim();

  console.log(
    `   🔤 OCR → "${text}"  (confidence: ${Math.round(data.confidence)}%)`
  );

  return { text, confidence: data.confidence };
}

// ── Response Normaliser ───────────────────────────────────────────────────────

function buildAddress(components: AddressComponents): string {
  const parts: string[] = [
    components.bno,
    components.bnm,
    components.flno,
    components.st,
    components.loc,
    components.dst,
    components.stcd,
    components.pncd,
  ].filter((p): p is string => Boolean(p));
  return parts.join(", ");
}

function normalise(raw: PortalRawResponse): GSTDetails {
  // Some portal versions nest data under taxpayerInfo
  const d: PortalRawResponse = raw.taxpayerInfo ?? raw;

  const pradr = d.pradr ?? {};
  const principalAddress =
    (pradr.addr ? buildAddress(pradr.addr) : "") || pradr.adr || "";

  // Extract PAN from GSTIN (characters 3-12, 0-indexed)
  const pan = (d.gstin ?? "").length >= 12 ? (d.gstin as string).slice(2, 12) : "";

  return {
    gstin:               d.gstin               ?? "",
    legal_name:          d.lgnm                ?? "",
    trade_name:          d.tradeNam            ?? "",
    status:              d.sts                 ?? "",
    registration_date:   d.rgdt               ?? "",
    cancellation_date:   d.cxdt || null,
    constitution:        d.ctb                 ?? "",
    taxpayer_type:       d.dty                 ?? "",
    state_jurisdiction:  d.stj                 ?? "",
    centre_jurisdiction: d.ctj                 ?? "",
    principal_address:   principalAddress,
    nature_of_business:  d.nba                 ?? [],
    einvoice_status:     d.einvoiceStatus      ?? "",
    aadhaar_verified:    d.adhrVFlag           ?? "",
    pan,
    _raw: raw,
  };
}

// ── Portal Error Classifier ───────────────────────────────────────────────────

type PortalOutcome =
  | { kind: "success"; data: PortalRawResponse }
  | { kind: "wrong_captcha" }
  | { kind: "not_found" }
  | { kind: "error"; message: string };

function classifyResponse(body: PortalRawResponse): PortalOutcome {
  if (
    body.errorCode === "SWEB_9000" ||
    (typeof body.message === "string" && body.message.toUpperCase().includes("CAPTCHA"))
  ) {
    return { kind: "wrong_captcha" };
  }

  if (body.errorCode === "SWEB_9035" || body.status_cd === "0") {
    return { kind: "not_found" };
  }

  if (body.errorCode) {
    return { kind: "error", message: body.message ?? `Portal error: ${body.errorCode}` };
  }

  if (body.gstin || body.lgnm) {
    return { kind: "success", data: body };
  }

  return { kind: "error", message: "Unexpected response from portal." };
}

// ── Main Export ───────────────────────────────────────────────────────────────

export class GSTServiceError extends Error {
  constructor(
    message: string,
    public readonly code: ApiError["error"]
  ) {
    super(message);
    this.name = "GSTServiceError";
  }
}

/**
 * Fetch full GSTIN details from the official GST portal.
 * Captcha is solved automatically via OCR with up to MAX_RETRIES attempts.
 *
 * @param gstin  15-character GSTIN (must already be validated & uppercased)
 * @throws GSTServiceError on not-found, portal errors, or exhausted retries
 */
export async function fetchGSTDetails(gstin: string): Promise<GSTDetails> {
  const session = await createSession();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`   ↻ Attempt ${attempt}/${MAX_RETRIES} for ${gstin}`);

    // ── Solve captcha ─────────────────────────────────────────────────────
    let captchaText: string;
    try {
      const result = await solveCaptcha(session);
      captchaText = result.text;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`   ⚠ Captcha error: ${msg}`);
      continue;
    }

    if (captchaText.length < 4) {
      console.warn(`   ⚠ OCR result too short ("${captchaText}"), retrying…`);
      continue;
    }

    // ── Submit to portal ──────────────────────────────────────────────────
    let body: PortalRawResponse;
    try {
      const resp = await session.post(SEARCH_URL, { gstin, captcha: captchaText });
      body = resp.data;
    } catch (err) {
      const axiosErr = err as AxiosError<PortalRawResponse>;
      if (axiosErr.response?.data) {
        body = axiosErr.response.data;
      } else {
        throw new GSTServiceError(
          `GST portal unreachable: ${axiosErr.message}`,
          `GST portal unreachable: ${axiosErr.message}`
        );
      }
    }

    // ── Classify response ─────────────────────────────────────────────────
    const outcome = classifyResponse(body);

    switch (outcome.kind) {
      case "success":
        console.log(`   ✅ Details fetched for ${gstin}`);
        return normalise(outcome.data);

      case "wrong_captcha":
        console.warn(`   ✗ Wrong captcha ("${captchaText}"), retrying…`);
        continue;

      case "not_found":
        throw new GSTServiceError(
          `GSTIN ${gstin} not found. Please verify the number.`,
          `GSTIN ${gstin} not found. Please verify the number.`
        );

      case "error":
        throw new GSTServiceError(outcome.message, outcome.message);
    }
  }

  throw new GSTServiceError(
    `Failed to solve captcha after ${MAX_RETRIES} attempts. ` +
      "The GST portal may be temporarily unavailable.",
    `Failed to solve captcha after ${MAX_RETRIES} attempts. ` +
      "The GST portal may be temporarily unavailable."
  );
}