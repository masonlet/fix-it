import type { GameAssets            } from "./assets.ts";
import type { FrameState, GameState } from "./types.ts";

export function updateFrame(
  canvas:    HTMLCanvasElement,
  frame:     FrameState,
  gameState: GameState,
  dt:        number,
): FrameState {
  switch (frame.game) {
    case "menu-main":  return frame;
    case "playing":    return frame;
    case "game-over":  return frame;
  }
}

export function renderFrame(
  ctx:       CanvasRenderingContext2D,
  canvas:    HTMLCanvasElement,
  assets:    GameAssets,
  gameState: GameState,
  frame:     FrameState,
): void {
  switch (frame.game) {
    case "menu-main":  break;
    case "playing":    break;
    case "game-over":  break;
  }
}
