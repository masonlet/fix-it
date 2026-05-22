import type { GameAssets            } from "./assets.ts";
import type { FrameState, GameState } from "./types.ts";
import { handleMainMenuFrame, renderMainMenuFrame } from "../ui/mainMenu.ts";
import { handleGameOverFrame, renderGameOverFrame } from "../ui/gameOver.ts";
import { updatePlayState, renderPlayState, resetPlayState } from "./play.ts";

function handlePlayingFrame(
  frame: FrameState,
  gameState: GameState,
  assets: GameAssets,
  dt: number,
  w: number, h: number
): FrameState {
  if (!frame.ui) {
    resetPlayState(gameState);
    return { game: "playing", ui: { initialized: true } };
  }
  if (updatePlayState(gameState, assets, dt, w, h)) return { game: "game-over", ui: null };
  return frame;
}


export function updateFrame(
  canvas:    HTMLCanvasElement,
  frame:     FrameState,
  gameState: GameState,
  assets:    GameAssets,
  dt:        number,
): FrameState {
  const { width: w, height: h } = canvas;
  switch (frame.game) {
    case "menu-main":  return handleMainMenuFrame(dt, frame.ui);
    case "playing":    return handlePlayingFrame(frame, gameState, assets, dt, w, h)
    case "game-over":  return handleGameOverFrame(w, h, gameState, frame.ui);
  }
}

export function renderFrame(
  ctx:       CanvasRenderingContext2D,
  canvas:    HTMLCanvasElement,
  assets:    GameAssets,
  gameState: GameState,
  frame:     FrameState,
): void {
  const { width: w, height: h } = canvas;
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(0, 0, w, h);

  switch (frame.game) {
    case "menu-main":  renderMainMenuFrame(ctx, w, h, gameState, frame.ui); break;
    case "playing":    renderPlayState(ctx, gameState, assets, w, h); break;
    case "game-over":  renderGameOverFrame(ctx, w, h, gameState, frame.ui); break;
  }
}
