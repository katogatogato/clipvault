import { ipcRenderer } from "electron";
import type { Clip, ClipCategory } from "../shared/types";

const CATEGORY_ICONS: Record<ClipCategory, string> = {
  text: "\uD83D\uDCCE",
  code: "\uD83D\uDCBB",
  url: "\uD83D\uDD17",
  email: "\u2709\uFE0F",
};

let allClips: Clip[] = [];
let filteredClips: Clip[] = [];
let selectedIndex = -1;
let contextMenu: HTMLDivElement | null = null;

const searchInput = document.getElementById("search-input") as HTMLInputElement;
const clipList = document.getElementById("clip-list") as HTMLDivElement;
const emptyState = document.getElementById("empty-state") as HTMLDivElement;
const clipCount = document.getElementById("clip-count") as HTMLSpanElement;
const clearBtn = document.getElementById("clear-btn") as HTMLButtonElement;
const closeBtn = document.getElementById("close-btn") as HTMLButtonElement;

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDateGroup(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  return "Older";
}

function getFirstLine(content: string): string {
  const line = content.split("\n")[0] || "";
  return line.length > 80 ? line.substring(0, 80) + "..." : line;
}

function getPreview(content: string): string {
  const lines = content.split("\n");
  if (lines.length > 1) {
    const secondLine = lines[1].trim();
    return secondLine.length > 60 ? secondLine.substring(0, 60) + "..." : secondLine;
  }
  return "";
}

function renderClips(): void {
  const childrenToRemove = clipList.querySelectorAll(".date-group");
  childrenToRemove.forEach((el) => el.remove());

  emptyState.classList.toggle("hidden", filteredClips.length > 0);
  clipCount.textContent = `${filteredClips.length} clip${filteredClips.length !== 1 ? "s" : ""}`;

  if (filteredClips.length === 0) {
    return;
  }

  const groups = new Map<string, Clip[]>();
  for (const clip of filteredClips) {
    const group = getDateGroup(clip.timestamp);
    const existing = groups.get(group);
    if (existing) {
      existing.push(clip);
    } else {
      groups.set(group, [clip]);
    }
  }

  const fragment = document.createDocumentFragment();

  groups.forEach((clips, label) => {
    const groupEl = document.createElement("div");
    groupEl.className = "date-group";

    const labelEl = document.createElement("div");
    labelEl.className = "date-label";
    labelEl.textContent = label;
    groupEl.appendChild(labelEl);

    for (const clip of clips) {
      const item = createClipElement(clip);
      groupEl.appendChild(item);
    }

    fragment.appendChild(groupEl);
  });

  clipList.appendChild(fragment);
  updateSelection();
}

function createClipElement(clip: Clip): HTMLDivElement {
  const item = document.createElement("div");
  item.className = "clip-item" + (clip.pinned ? " pinned" : "");
  item.dataset.id = clip.id;

  const icon = document.createElement("div");
  icon.className = "clip-icon";
  icon.textContent = CATEGORY_ICONS[clip.category];

  const content = document.createElement("div");
  content.className = "clip-content";

  const title = document.createElement("div");
  title.className = "clip-title";
  title.textContent = getFirstLine(clip.content);

  const preview = document.createElement("div");
  preview.className = "clip-preview";
  preview.textContent = getPreview(clip.content);
  if (!preview.textContent) {
    preview.style.display = "none";
  }

  const meta = document.createElement("div");
  meta.className = "clip-meta";

  const time = document.createElement("span");
  time.className = "clip-time";
  time.textContent = formatTime(clip.timestamp);

  const badge = document.createElement("span");
  badge.className = "clip-category-badge " + clip.category;
  badge.textContent = clip.category;

  meta.appendChild(time);
  meta.appendChild(badge);
  content.appendChild(title);
  content.appendChild(preview);
  content.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "clip-actions";

  const pinBtn = document.createElement("button");
  pinBtn.className = "clip-action-btn pin-btn" + (clip.pinned ? " is-pinned" : "");
  pinBtn.innerHTML = clip.pinned
    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  pinBtn.title = clip.pinned ? "Unpin" : "Pin";
  pinBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    handlePin(clip.id);
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "clip-action-btn delete-btn";
  deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
  deleteBtn.title = "Delete";
  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    handleDelete(clip.id, item);
  });

  actions.appendChild(pinBtn);
  actions.appendChild(deleteBtn);

  item.appendChild(icon);
  item.appendChild(content);
  item.appendChild(actions);

  item.addEventListener("click", () => {
    handleCopy(clip.id);
  });

  item.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    showContextMenu(e, clip);
  });

  return item;
}

function updateSelection(): void {
  const items = clipList.querySelectorAll(".clip-item");
  items.forEach((item, i) => {
    item.classList.toggle("selected", i === selectedIndex);
  });

  if (selectedIndex >= 0 && items[selectedIndex]) {
    items[selectedIndex].scrollIntoView({ block: "nearest" });
  }
}

function handleCopy(id: string): void {
  ipcRenderer.invoke("copy-clip", id);
}

function handleDelete(id: string, element: HTMLElement): void {
  element.classList.add("removing");
  setTimeout(() => {
    ipcRenderer.invoke("delete-clip", id).then((updatedClips: Clip[]) => {
      allClips = updatedClips;
      applySearch();
    });
  }, 200);
}

function handlePin(id: string): void {
  ipcRenderer.invoke("pin-clip", id).then((updatedClips: Clip[]) => {
    allClips = updatedClips;
    applySearch();
  });
}

function handleClear(): void {
  ipcRenderer.invoke("clear-history").then((updatedClips: Clip[]) => {
    allClips = updatedClips;
    applySearch();
  });
}

function applySearch(): void {
  const query = searchInput.value.trim();
  if (query) {
    filteredClips = allClips.filter(
      (c) =>
        c.content.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
    );
  } else {
    filteredClips = [...allClips];
  }
  selectedIndex = -1;
  renderClips();
}

function showContextMenu(e: MouseEvent, clip: Clip): void {
  hideContextMenu();

  contextMenu = document.createElement("div");
  contextMenu.className = "context-menu";

  const copyItem = document.createElement("div");
  copyItem.className = "context-menu-item";
  copyItem.textContent = "Copy to Clipboard";
  copyItem.addEventListener("click", () => {
    handleCopy(clip.id);
    hideContextMenu();
  });

  const pinItem = document.createElement("div");
  pinItem.className = "context-menu-item";
  pinItem.textContent = clip.pinned ? "Unpin" : "Pin";
  pinItem.addEventListener("click", () => {
    handlePin(clip.id);
    hideContextMenu();
  });

  const divider = document.createElement("div");
  divider.className = "context-menu-divider";

  const deleteItem = document.createElement("div");
  deleteItem.className = "context-menu-item danger";
  deleteItem.textContent = "Delete";
  deleteItem.addEventListener("click", () => {
    const element = clipList.querySelector(`[data-id="${clip.id}"]`) as HTMLElement;
    handleDelete(clip.id, element);
    hideContextMenu();
  });

  contextMenu.appendChild(copyItem);
  contextMenu.appendChild(pinItem);
  contextMenu.appendChild(divider);
  contextMenu.appendChild(deleteItem);

  contextMenu.style.left = `${e.clientX}px`;
  contextMenu.style.top = `${e.clientY}px`;

  document.body.appendChild(contextMenu);

  const rect = contextMenu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    contextMenu.style.left = `${window.innerWidth - rect.width - 4}px`;
  }
  if (rect.bottom > window.innerHeight) {
    contextMenu.style.top = `${window.innerHeight - rect.height - 4}px`;
  }
}

function hideContextMenu(): void {
  if (contextMenu) {
    contextMenu.remove();
    contextMenu = null;
  }
}

searchInput.addEventListener("input", () => {
  applySearch();
});

searchInput.addEventListener("keydown", (e) => {
  const items = clipList.querySelectorAll(".clip-item");
  const total = items.length;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, total - 1);
      updateSelection();
      break;
    case "ArrowUp":
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      updateSelection();
      break;
    case "Enter":
      e.preventDefault();
      if (selectedIndex >= 0 && items[selectedIndex]) {
        const id = (items[selectedIndex] as HTMLElement).dataset.id;
        if (id) {
          handleCopy(id);
        }
      }
      break;
    case "Escape":
      e.preventDefault();
      ipcRenderer.invoke("hide-window");
      break;
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (contextMenu) {
      hideContextMenu();
    } else {
      ipcRenderer.invoke("hide-window");
    }
  }

  if (e.key === "/" && document.activeElement !== searchInput) {
    e.preventDefault();
    searchInput.focus();
  }
});

document.addEventListener("click", () => {
  hideContextMenu();
});

clearBtn.addEventListener("click", handleClear);

closeBtn.addEventListener("click", () => {
  ipcRenderer.invoke("hide-window");
});

ipcRenderer.on("clip-updated", (_event, updatedClips: Clip[]) => {
  if (updatedClips && updatedClips.length > 0) {
    allClips = updatedClips;
  } else {
    ipcRenderer.invoke("get-clips").then((clips: Clip[]) => {
      allClips = clips;
      applySearch();
    });
    return;
  }
  applySearch();
});

ipcRenderer.invoke("get-clips").then((clips: Clip[]) => {
  allClips = clips;
  applySearch();
  searchInput.focus();
});
