import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { Clip, StoreData } from "../shared/types";

const STORE_DIR = path.join(os.homedir(), ".clipvault");
const STORE_FILE = path.join(STORE_DIR, "history.json");
const MAX_CLIPS = 500;

function ensureStoreDir(): void {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
  }
}

function readStore(): StoreData {
  ensureStoreDir();
  if (!fs.existsSync(STORE_FILE)) {
    return { clips: [] };
  }
  const raw = fs.readFileSync(STORE_FILE, "utf-8");
  return JSON.parse(raw) as StoreData;
}

function writeStore(data: StoreData): void {
  ensureStoreDir();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function evictIfNeeded(clips: Clip[]): Clip[] {
  const pinned = clips.filter((c) => c.pinned);
  const unpinned = clips.filter((c) => !c.pinned);

  const maxUnpinned = MAX_CLIPS - pinned.length;
  if (unpinned.length > maxUnpinned) {
    const sorted = unpinned.sort((a, b) => b.timestamp - a.timestamp);
    const kept = sorted.slice(0, maxUnpinned);
    return [...pinned, ...kept].sort((a, b) => b.timestamp - a.timestamp);
  }

  return clips.sort((a, b) => b.timestamp - a.timestamp);
}

export function getAllClips(): Clip[] {
  return readStore().clips;
}

export function addClip(clip: Clip): Clip[] {
  const store = readStore();

  const duplicate = store.clips.find((c) => c.content === clip.content);
  if (duplicate) {
    duplicate.timestamp = clip.timestamp;
    store.clips = evictIfNeeded(store.clips);
    writeStore(store);
    return store.clips;
  }

  store.clips.push(clip);
  store.clips = evictIfNeeded(store.clips);
  writeStore(store);
  return store.clips;
}

export function deleteClip(id: string): Clip[] {
  const store = readStore();
  store.clips = store.clips.filter((c) => c.id !== id);
  writeStore(store);
  return store.clips;
}

export function togglePin(id: string): Clip[] {
  const store = readStore();
  const clip = store.clips.find((c) => c.id === id);
  if (clip) {
    clip.pinned = !clip.pinned;
    store.clips = evictIfNeeded(store.clips);
    writeStore(store);
  }
  return store.clips;
}

export function clearHistory(): Clip[] {
  const store = readStore();
  store.clips = store.clips.filter((c) => c.pinned);
  writeStore(store);
  return store.clips;
}

export function searchClips(query: string): Clip[] {
  const clips = getAllClips();
  const lower = query.toLowerCase();
  return clips.filter(
    (c) =>
      c.content.toLowerCase().includes(lower) ||
      c.category.toLowerCase().includes(lower)
  );
}
