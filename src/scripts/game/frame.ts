import type { FrameState } from "./types";

export function updateFrame(
  canvas: HTMLCanvasElement,
  frame:  FrameState,
  dt:     number,
): FrameState {
  switch (frame.game) {
    case "preloading": return frame;
    case "menu-main":  return frame;
    case "playing":    return frame;
    case "game-over":  return frame;
  }
}

export function renderFrame(
  ctx:    CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  frame:  FrameState,
): void {
  switch (frame.game) {
    case "preloading": break;
    case "menu-main":  break;
    case "playing":    break;
    case "game-over":  break;
  }
}
