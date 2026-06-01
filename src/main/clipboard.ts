import { clipboard } from "electron";
import type { Clip, ClipCategory } from "../shared/types";
import { addClip } from "./store";

let lastContent = "";
let intervalHandle: ReturnType<typeof setInterval> | null = null;

function categorize(text: string): ClipCategory {
  const trimmed = text.trim();

  if (/^https?:\/\/\S+$/i.test(trimmed) || /^ftp:\/\/\S+$/i.test(trimmed)) {
    return "url";
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
    return "email";
  }

  const codeIndicators = [
    /\bfunction\b/,
    /\bclass\b/,
    /\bimport\b/,
    /\bexport\b/,
    /\bconst\b\s+\w+\s*[=:]/,
    /\blet\b\s+\w+\s*[=:]/,
    /\bvar\b\s+\w+\s*[=:]/,
    /\breturn\b/,
    /\bif\s*\(/,
    /\bfor\s*\(/,
    /\bwhile\s*\(/,
    /\bswitch\s*\(/,
    /\btry\s*\{/,
    /\bcatch\s*\(/,
    /=>/,
    /\{[\s\S]*\}/,
    /\([\s\S]*\)\s*=>/,
    /;\s*$/m,
    /\/\/.*$/m,
    /\/\*/,
    /#include/,
    /#define/,
    /\bdef\s+\w+/,
    /\bfn\s+\w+/,
    /\bpub\s+fn/,
    /\buse\s+/,
  ];

  let codeScore = 0;
  for (const pattern of codeIndicators) {
    if (pattern.test(trimmed)) {
      codeScore++;
    }
  }

  const hasBrackets = /[{}\[\]]/.test(trimmed);
  const hasSemicolons = (trimmed.match(/;/g) || []).length >= 2;
  const lineCount = trimmed.split("\n").length;

  if (
    codeScore >= 2 ||
    (codeScore >= 1 && lineCount > 3) ||
    (hasBrackets && hasSemicolons && lineCount > 1)
  ) {
    return "code";
  }

  return "text";
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function startClipboardMonitor(
  onNewClip: (clips: Clip[]) => void
): void {
  lastContent = clipboard.readText();

  intervalHandle = setInterval(() => {
    const current = clipboard.readText();
    if (current && current !== lastContent) {
      lastContent = current;

      const clip: Clip = {
        id: generateId(),
        content: current,
        category: categorize(current),
        timestamp: Date.now(),
        pinned: false,
      };

      const updatedClips = addClip(clip);
      onNewClip(updatedClips);
    }
  }, 500);
}

export function stopClipboardMonitor(): void {
  if (intervalHandle !== null) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
