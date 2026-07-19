export const GEMINI_KEY_STORAGE = "agent-yap:gemini-api-key";
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";

const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_MAX_OUTPUT_TOKENS = 2048;

const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export type ChatRole = "user" | "model";

export interface ChatMessage {
  role: ChatRole;
  text: string;
}

export type ChatErrorKind =
  | "bad-key"
  | "quota"
  | "blocked"
  | "network"
  | "aborted"
  | "unknown";

export class GeminiChatError extends Error {
  kind: ChatErrorKind;
  status?: number;

  constructor(kind: ChatErrorKind, message: string, status?: number) {
    super(message);
    this.name = "GeminiChatError";
    this.kind = kind;

    if (status !== undefined) {
      this.status = status;
    }
  }
}

export interface GeminiChatOptions {
  apiKey: string;
  model?: string;
  system: string;
  messages: ChatMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  signal?: AbortSignal;
  onChunk: (textDelta: string) => void;
}

interface GeminiPart {
  text?: string;
}

interface GeminiContent {
  parts?: GeminiPart[];
  role?: string;
}

interface GeminiCandidate {
  content?: GeminiContent;
  finishReason?: string;
}

interface GeminiPromptFeedback {
  blockReason?: string;
  blockReasonMessage?: string;
}

interface GeminiGenerateResponse {
  candidates?: GeminiCandidate[];
  promptFeedback?: GeminiPromptFeedback;
}

interface GeminiApiError {
  code?: number;
  message?: string;
  status?: string;
  details?: unknown[];
}

interface GeminiApiErrorPayload {
  error?: GeminiApiError;
}

interface GeminiRequestBody {
  system_instruction: {
    parts: [{ text: string }];
  };
  contents: Array<{
    role: ChatRole;
    parts: [{ text: string }];
  }>;
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
  };
}

/**
 * Returns the stored Gemini API key in browser environments.
 */
export function getStoredGeminiKey(): string | null {
  const storage = getBrowserStorage();
  if (!storage) return null;

  try {
    return storage.getItem(GEMINI_KEY_STORAGE);
  } catch {
    return null;
  }
}

/**
 * Stores a Gemini API key in browser localStorage, or clears it when empty.
 */
export function setStoredGeminiKey(key: string): void {
  const storage = getBrowserStorage();
  if (!storage) return;

  const trimmedKey = key.trim();

  try {
    if (trimmedKey) {
      storage.setItem(GEMINI_KEY_STORAGE, trimmedKey);
    } else {
      storage.removeItem(GEMINI_KEY_STORAGE);
    }
  } catch {
    // Storage can be unavailable in private or locked-down browser contexts.
  }
}

/**
 * Clears the stored Gemini API key in browser environments.
 */
export function clearStoredGeminiKey(): void {
  const storage = getBrowserStorage();
  if (!storage) return;

  try {
    storage.removeItem(GEMINI_KEY_STORAGE);
  } catch {
    // Storage can be unavailable in private or locked-down browser contexts.
  }
}

/**
 * Performs a permissive Gemini key shape check for UX hints only.
 */
export function looksLikeGeminiKey(key: string): boolean {
  const trimmedKey = key.trim();
  return trimmedKey.startsWith("AIza") && trimmedKey.length >= 30;
}

/**
 * Extracts the JSON payload from one SSE data line.
 */
export function parseSseLine(line: string): string | null {
  const trimmedLine = line.trimStart();
  if (!trimmedLine.startsWith("data:")) return null;

  const payload = trimmedLine.slice("data:".length).trim();
  if (!payload || payload === "[DONE]") return null;

  return payload;
}

/**
 * Streams a Gemini chat completion from the browser and emits text deltas.
 */
export async function streamGeminiChat(
  opts: GeminiChatOptions,
): Promise<{ text: string; finishReason: string | null }> {
  const model = normalizeModel(opts.model ?? DEFAULT_GEMINI_MODEL);
  const response = await fetchGeminiStream(model, makeRequestBody(opts), opts);

  if (!response.ok) {
    throw mapHttpError(response.status, await readErrorPayload(response));
  }

  if (!response.body) {
    throw new GeminiChatError(
      "unknown",
      "Gemini streaming response did not include a readable body.",
      response.status,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let finishReason: string | null = null;

  const processLine = (line: string): void => {
    const payload = parseSseLine(line);
    if (!payload) return;

    const chunk = parseSsePayload(payload);
    assertNotBlocked(chunk, response.status);

    const candidate = chunk.candidates?.[0];
    if (!candidate) return;

    if (candidate.finishReason) {
      finishReason = candidate.finishReason;

      if (candidate.finishReason === "SAFETY") {
        throw new GeminiChatError(
          "blocked",
          "Gemini blocked the response for safety reasons.",
          response.status,
        );
      }
    }

    for (const part of candidate.content?.parts ?? []) {
      if (!part.text) continue;

      text += part.text;
      opts.onChunk(part.text);
    }
  };

  try {
    while (true) {
      const result = await readStreamChunk(reader);

      if (result.done) break;

      buffer += decoder.decode(result.value, { stream: true });
      buffer = processSseBuffer(buffer, processLine);
    }
  } finally {
    reader.releaseLock();
  }

  buffer += decoder.decode();
  processSseBuffer(buffer, processLine, true);

  return { text, finishReason };
}

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function makeRequestBody(opts: GeminiChatOptions): GeminiRequestBody {
  return {
    system_instruction: {
      parts: [{ text: opts.system }],
    },
    contents: opts.messages.map((message) => ({
      role: message.role,
      parts: [{ text: message.text }],
    })),
    generationConfig: {
      temperature: opts.temperature ?? DEFAULT_TEMPERATURE,
      maxOutputTokens: opts.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
    },
  };
}

async function fetchGeminiStream(
  model: string,
  body: GeminiRequestBody,
  opts: GeminiChatOptions,
): Promise<Response> {
  try {
    return await fetch(`${API_BASE_URL}/models/${model}:streamGenerateContent?alt=sse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": opts.apiKey,
      },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
  } catch (error) {
    throw mapFetchError(error);
  }
}

async function readStreamChunk(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): Promise<ReadableStreamReadResult<Uint8Array>> {
  try {
    return await reader.read();
  } catch (error) {
    throw mapFetchError(error);
  }
}

function normalizeModel(model: string): string {
  return encodeURIComponent(model.trim().replace(/^models\//, ""));
}

function processSseBuffer(
  buffer: string,
  processLine: (line: string) => void,
  flush = false,
): string {
  let start = 0;

  while (true) {
    const newlineIndex = buffer.indexOf("\n", start);
    if (newlineIndex === -1) break;

    const line = buffer.slice(start, newlineIndex).replace(/\r$/, "");
    processLine(line);
    start = newlineIndex + 1;
  }

  const remaining = buffer.slice(start);

  if (flush && remaining) {
    processLine(remaining.replace(/\r$/, ""));
    return "";
  }

  return remaining;
}

function parseSsePayload(payload: string): GeminiGenerateResponse {
  try {
    return JSON.parse(payload) as GeminiGenerateResponse;
  } catch {
    throw new GeminiChatError("unknown", "Gemini returned malformed SSE data.");
  }
}

function assertNotBlocked(chunk: GeminiGenerateResponse, status: number): void {
  const blockReason = chunk.promptFeedback?.blockReason;
  if (!blockReason) return;

  const message =
    chunk.promptFeedback?.blockReasonMessage ??
    `Gemini blocked the prompt: ${blockReason}.`;

  throw new GeminiChatError("blocked", message, status);
}

async function readErrorPayload(response: Response): Promise<GeminiApiErrorPayload | null> {
  const text = await response.text().catch(() => "");
  if (!text) return null;

  try {
    return JSON.parse(text) as GeminiApiErrorPayload;
  } catch {
    return {
      error: {
        message: text,
      },
    };
  }
}

function mapHttpError(
  status: number,
  payload: GeminiApiErrorPayload | null,
): GeminiChatError {
  const message = payload?.error?.message ?? `Gemini request failed with HTTP ${status}.`;

  if ((status === 400 && isInvalidApiKey(payload)) || status === 401 || status === 403) {
    return new GeminiChatError("bad-key", message, status);
  }

  if (status === 429) {
    return new GeminiChatError("quota", message, status);
  }

  return new GeminiChatError("unknown", message, status);
}

function isInvalidApiKey(payload: GeminiApiErrorPayload | null): boolean {
  const error = payload?.error;
  return (
    error?.status === "API_KEY_INVALID" ||
    error?.message?.includes("API_KEY_INVALID") === true ||
    JSON.stringify(error?.details ?? []).includes("API_KEY_INVALID")
  );
}

function mapFetchError(error: unknown): GeminiChatError {
  if (isAbortError(error)) {
    return new GeminiChatError("aborted", "Gemini request was aborted.");
  }

  const message = error instanceof Error ? error.message : "Gemini request failed.";
  return new GeminiChatError("network", message);
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === "AbortError"
  );
}
