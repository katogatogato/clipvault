export type ClipCategory = "text" | "code" | "url" | "email";

export interface Clip {
  id: string;
  content: string;
  category: ClipCategory;
  timestamp: number;
  pinned: boolean;
}

export interface StoreData {
  clips: Clip[];
}

export interface IPCMessages {
  "get-clips": () => Clip[];
  "search-clips": (query: string) => Clip[];
  "copy-clip": (id: string) => void;
  "delete-clip": (id: string) => void;
  "pin-clip": (id: string) => void;
  "clear-history": () => void;
  "clip-updated": (clips: Clip[]) => void;
  "hide-window": () => void;
}
