#!/usr/bin/env node
/**
 * Fetch one portrait-orientation public-domain artwork per chapter from
 * The Met Open Access API (CC0), writing images to public/art/<slug>.jpg and
 * an attribution manifest to src/lib/art-manifest.json.
 *
 * Originally targeted the Art Institute of Chicago, but AIC's image CDN
 * (www.artic.edu/iiif) 403s this region even from a real browser, so the
 * script now uses The Met (verified working): search → object → image, with
 * portrait detection done by parsing JPEG dimensions from the bytes since the
 * Met object payload carries no pixel size.
 *
 * Usage: node scripts/fetch-art.mjs [--force]
 * Idempotent: chapters with a manifest entry AND an existing image are skipped.
 */
import fs from "node:fs/promises";
import path from "node:path";

const BOOK_DIR = path.join(process.cwd(), "content", "architecture-and-system-design");
const MANIFEST_PATH = path.join(process.cwd(), "src", "lib", "art-manifest.json");
const ART_DIR = path.join(process.cwd(), "public", "art");
const MET_BASE = "https://collectionapi.metmuseum.org/public/collection/v1";
const REQUEST_DELAY_MS = 150;
const REQUEST_TIMEOUT_MS = 30000;
const MIN_IMAGE_BYTES = 10 * 1024;
const MAX_CANDIDATES_PER_TERM = 40;
const PORTRAIT_RATIO = 1.15;

const force = process.argv.includes("--force");

// One primary term per chapter (index = chapterNumber - 1 mod length), the
// rest as deterministic fallbacks. Chosen to surface portrait-friendly,
// abstract/painterly public-domain material in the Met collection.
const searchTerms = [
  "japanese woodblock print",
  "kimono textile",
  "color woodcut",
  "art nouveau poster",
  "botanical watercolor",
  "hanging scroll",
  "stained glass window design",
  "tapestry fragment",
  "calligraphy panel",
  "ukiyo-e actor",
  "architectural drawing elevation",
  "silk panel",
  "egyptian papyrus",
  "illuminated manuscript leaf",
  "abstract watercolor",
  "persian miniature",
  "embroidered panel",
  "lithograph poster",
  "ink landscape",
  "decorative screen",
];

let lastRequestAt = 0;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForRateLimit() {
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < REQUEST_DELAY_MS) {
    await delay(REQUEST_DELAY_MS - elapsed);
  }
}

async function request(url) {
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt++) {
    await waitForRateLimit();
    lastRequestAt = Date.now();

    try {
      return await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (error) {
      lastError = error;
      if (attempt === 1) {
        console.warn(`  request failed; retrying once: ${error.message}`);
        continue;
      }
    }
  }

  throw new Error(`Request failed after retry: ${url}\n${lastError?.message ?? lastError}`);
}

/**
 * Read JPEG pixel dimensions from a buffer by walking marker segments to the
 * first SOF marker. Returns null when the buffer is not a parseable JPEG.
 */
function jpegDimensions(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = bytes[offset + 1];
    // Standalone markers without a length segment.
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9) || marker === 0x01) {
      offset += 2;
      continue;
    }
    const length = bytes.readUInt16BE(offset + 2);
    // SOF0–SOF15 (excluding DHT 0xc4, JPG 0xc8, DAC 0xcc) carry dimensions.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return null;
}

async function loadManifest() {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      version: 1,
      chapters: parsed && typeof parsed.chapters === "object" && parsed.chapters
        ? parsed.chapters
        : {},
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return { version: 1, chapters: {} };
    }
    throw new Error(`Could not read ${MANIFEST_PATH}: ${error.message}`);
  }
}

async function fileExists(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function getChapters() {
  const entries = await fs.readdir(BOOK_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && /^chapter-\d+-.*\.md$/.test(entry.name))
    .map((entry) => {
      const numberMatch = entry.name.match(/^chapter-(\d+)/);
      const chapterNumber = numberMatch ? Number.parseInt(numberMatch[1], 10) : 0;

      // Keep this in sync with src/lib/content.ts:
      // const chapterSlug = file.replace(/^chapter-/, "").replace(/\.md$/, "");
      const slug = entry.name.replace(/^chapter-/, "").replace(/\.md$/, "");

      return { file: entry.name, chapterNumber, slug };
    })
    .sort((a, b) => a.file.localeCompare(b.file));
}

async function searchObjectIds(term) {
  const url = new URL(`${MET_BASE}/search`);
  url.searchParams.set("q", term);
  url.searchParams.set("hasImages", "true");
  url.searchParams.set("isPublicDomain", "true");

  const response = await request(url);
  if (!response.ok) {
    throw new Error(`Met search failed for "${term}": HTTP ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const ids = Array.isArray(payload.objectIDs) ? payload.objectIDs : [];
  return ids.slice(0, MAX_CANDIDATES_PER_TERM);
}

async function fetchObject(objectId) {
  const response = await request(`${MET_BASE}/objects/${objectId}`);
  if (!response.ok) return null;
  return response.json();
}

/**
 * Download a candidate image and keep it only when it is a portrait JPEG.
 * Returns { ok: true, width, height } or { ok: false, reason }.
 */
async function downloadCandidate(chapter, imageUrl) {
  const response = await request(imageUrl);

  if (!response.ok) {
    return { ok: false, reason: `HTTP ${response.status} ${response.statusText}` };
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("image/")) {
    return { ok: false, reason: `unexpected content-type "${contentType || "missing"}"` };
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length <= MIN_IMAGE_BYTES) {
    return { ok: false, reason: `image too small (${bytes.length} bytes)` };
  }

  const dims = jpegDimensions(bytes);
  if (!dims) {
    return { ok: false, reason: "could not parse JPEG dimensions" };
  }
  if (dims.height <= dims.width * PORTRAIT_RATIO) {
    return { ok: false, reason: `not portrait (${dims.width}x${dims.height})` };
  }

  await fs.mkdir(ART_DIR, { recursive: true });
  await fs.writeFile(path.join(ART_DIR, `${chapter.slug}.jpg`), bytes);

  return { ok: true, width: dims.width, height: dims.height };
}

async function chooseArtwork(chapter, usedArtworkIds) {
  const startingIndex = (chapter.chapterNumber - 1) % searchTerms.length;

  for (let offset = 0; offset < searchTerms.length; offset++) {
    const termIndex = (startingIndex + offset) % searchTerms.length;
    const term = searchTerms[termIndex];

    if (offset > 0) {
      console.log(`  ${chapter.slug}: falling back to "${term}"`);
    }

    let candidateIds;
    try {
      candidateIds = await searchObjectIds(term);
    } catch (error) {
      console.warn(`  ${chapter.slug}: search failed for "${term}": ${error.message}`);
      continue;
    }

    for (const objectId of candidateIds) {
      if (usedArtworkIds.has(objectId)) continue;

      let object;
      try {
        object = await fetchObject(objectId);
      } catch (error) {
        console.warn(`  ${chapter.slug}: object ${objectId} failed (${error.message})`);
        continue;
      }
      if (!object || object.isPublicDomain !== true) continue;

      const imageUrl = object.primaryImageSmall || object.primaryImage;
      if (!imageUrl) continue;

      let downloaded;
      try {
        downloaded = await downloadCandidate(chapter, imageUrl);
      } catch (error) {
        downloaded = { ok: false, reason: error.message };
      }

      if (!downloaded.ok) {
        continue;
      }

      usedArtworkIds.add(objectId);
      return {
        chapterNumber: chapter.chapterNumber,
        artworkId: objectId,
        title: object.title || "Untitled",
        artist: object.artistDisplayName || "",
        date: object.objectDate || "",
        file: `/art/${chapter.slug}.jpg`,
        sourceUrl: object.objectURL || `https://www.metmuseum.org/art/collection/search/${objectId}`,
      };
    }

    console.log(`  ${chapter.slug}: no unused portrait image found for "${term}"`);
  }

  return null;
}

function sortedManifest(chapters, entries) {
  const sortedChapters = {};
  for (const chapter of chapters.slice().sort((a, b) => a.chapterNumber - b.chapterNumber)) {
    if (entries[chapter.slug]) {
      sortedChapters[chapter.slug] = entries[chapter.slug];
    }
  }
  return { version: 1, chapters: sortedChapters };
}

async function main() {
  const chapters = await getChapters();
  const manifest = await loadManifest();
  const nextEntries = {};
  const usedArtworkIds = new Set();

  let fetched = 0;
  let skipped = 0;
  let failed = 0;

  for (const chapter of chapters) {
    const existing = manifest.chapters[chapter.slug];
    const imagePath = path.join(ART_DIR, `${chapter.slug}.jpg`);

    if (
      !force
      && existing
      && Number.isInteger(existing.artworkId)
      && await fileExists(imagePath)
    ) {
      nextEntries[chapter.slug] = existing;
      usedArtworkIds.add(existing.artworkId);
      skipped++;
      console.log(`${chapter.slug}: skipped existing artwork ${existing.artworkId}`);
      continue;
    }

    const entry = await chooseArtwork(chapter, usedArtworkIds);
    if (!entry) {
      failed++;
      console.error(`${chapter.slug}: FAILED to fetch usable artwork`);
      continue;
    }

    nextEntries[chapter.slug] = entry;
    fetched++;
    console.log(`${chapter.slug}: ${entry.title} - ${entry.artist || "Unknown artist"}`);
  }

  await fs.mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
  await fs.writeFile(
    MANIFEST_PATH,
    `${JSON.stringify(sortedManifest(chapters, nextEntries), null, 2)}\n`,
    "utf8",
  );

  const missing = chapters.filter((chapter) => !nextEntries[chapter.slug]);
  console.log(`\nSummary: fetched ${fetched}, skipped ${skipped}, failed ${failed}`);

  if (failed > 0 || missing.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error?.stack ?? error);
  process.exitCode = 1;
});
