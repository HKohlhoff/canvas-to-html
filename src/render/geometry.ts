import type { CanvasNode } from "./types";

import type { CanvasEdgeEnd } from "./types";

export function getBounds(nodes: CanvasNode[]): { width: number; height: number; offsetX: number; offsetY: number } {
  if (nodes.length === 0) {
    return { width: 1200, height: 800, offsetX: 120, offsetY: 120 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const x = normalizeNumber(node.x);
    const y = normalizeNumber(node.y);
    const width = Math.max(120, normalizeNumber(node.width));
    const height = Math.max(60, normalizeNumber(node.height));
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  }

  const padding = 120;
  const offsetX = padding - minX;
  const offsetY = padding - minY;

  return {
    width: Math.max(1200, Math.ceil(maxX - minX + padding * 2)),
    height: Math.max(800, Math.ceil(maxY - minY + padding * 2)),
    offsetX,
    offsetY,
  };
}

export function getNodeFrame(node: CanvasNode, offsetX: number, offsetY: number): { left: number; top: number; width: number; height: number } {
  const mediaKind = (node.type || "").toLowerCase() === "file" ? getNodeMediaKind(node) : "";
  const minHeight = mediaKind === "audio" ? 86 : mediaKind === "video" ? 180 : 60;
  return {
    left: normalizeNumber(node.x) + offsetX,
    top: normalizeNumber(node.y) + offsetY,
    width: Math.max(120, normalizeNumber(node.width)),
    height: Math.max(minHeight, normalizeNumber(node.height)),
  };
}

export function normalizeSide(side: string | undefined): "top" | "bottom" | "left" | "right" {
  if (side === "top" || side === "bottom" || side === "left" || side === "right") {
    return side;
  }
  return "right";
}

export function normalizeEdgeEnd(end: string | undefined, fallback: "none" | "arrow"): CanvasEdgeEnd {
  const value = String(end || "").trim().toLowerCase();
  if (!value) return fallback;
  const exactValues: readonly CanvasEdgeEnd[] = [
    "none",
    "arrow",
    "triangle",
    "triangle-outline",
    "thin-triangle",
    "halved-triangle",
    "circle",
    "circle-outline",
    "diamond",
    "diamond-outline",
    "square",
    "bar",
    "blunt",
  ];
  if (exactValues.includes(value as CanvasEdgeEnd)) return value as CanvasEdgeEnd;
  if (value.includes("diamond")) return "diamond";
  if (value.includes("square")) return "square";
  if (value.includes("circle") || value.includes("dot")) return "circle";
  if (value.includes("bar") || value.includes("line")) return "bar";
  if (value.includes("triangle")) return "triangle";
  if (value.includes("arrow")) return "arrow";
  return fallback;
}

export function normalizeEdgeLineStyle(style: string | undefined): "solid" | "dashed" | "dotted" | "short-dash" | "long-dash" | "dash-dot" {
  const value = String(style || "").trim().toLowerCase();
  if (!value) return "solid";
  if (value.includes("dash") && value.includes("dot")) return "dash-dot";
  if (value.includes("short")) return "short-dash";
  if (value.includes("long")) return "long-dash";
  if (value.includes("dot")) return "dotted";
  if (value.includes("dash")) return "dashed";
  return "solid";
}

export function normalizeEdgeWidth(width: number | undefined): number {
  const value = Number(width);
  return Number.isFinite(value) ? Math.max(1, value) : 2;
}

function normalizeNumber(value: number | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

export function getNodeMediaKind(node: CanvasNode): "audio" | "video" | "" {
  if (node.fileKind === "audio" || node.fileKind === "video") return node.fileKind;
  return inferMediaFileKind(node.exportPath || node.file || "");
}

function inferMediaFileKind(path: string): "audio" | "video" | "" {
  const extension = getPathExtension(path);
  if (["mp3", "wav", "m4a", "aac", "ogg", "oga", "flac"].includes(extension)) return "audio";
  if (["mp4", "m4v", "mov", "webm", "ogv"].includes(extension)) return "video";
  return "";
}

function getPathExtension(path: string): string {
  const cleanPath = String(path || "").split(/[?#]/, 1)[0] || "";
  const fileName = cleanPath.split("/").pop() || cleanPath;
  const dot = fileName.lastIndexOf(".");
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : "";
}
