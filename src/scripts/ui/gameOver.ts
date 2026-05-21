import { pointerX, pointerY, wasPointerClicked } from "web-engine/input/pointer.ts";
import { playSound                             } from "web-engine/audio/playback.ts";
import { YouTubePlayables } from "../sdk/youTubePlayables.ts";
import { WaveDash         } from "../sdk/waveDash.ts";
import type { FrameState, GameState, GameOverState } from "../game/types.ts";

function hitTest(px: number, py: number, cx: number, cy: number, w: number, h: number): boolean {
  return px >= cx - w/2 && px <= cx + w/2 && py >= cy - h/2 && py <= cy + h/2;
}

export function handleGameOverFrame(
  w:         number,
  h:         number,
  gameState: GameState,
  ui:        GameOverState | null,
): FrameState {
  if (!ui) {
    const isNewHigh = gameState.score > (gameState.highScore ?? 0);
    if (isNewHigh) gameState.highScore = gameState.score;

    playSound("death");
    YouTubePlayables.sendScore(gameState.score);
    YouTubePlayables.saveData({ highScore: gameState.highScore });
    WaveDash.submitScore(gameState.score);

    return { game: "game-over", ui: { isNewHigh, playHovered: false, menuHovered: false } };
  }

  const px = pointerX(), py = pointerY();
  const playHovered = hitTest(px, py, w/2, h * 0.7, w * 0.4, h * 0.07);
  const menuHovered = hitTest(px, py, w/2, h * 0.8, w * 0.3, h * 0.06);

  if (wasPointerClicked()) {
    if (playHovered) { playSound("button"); return { game: "playing",   ui: null }; }
    if (menuHovered) { playSound("button"); return { game: "menu-main", ui: null }; }
  }

  return { game: "game-over", ui: { ...ui, playHovered, menuHovered } };
}

export function renderGameOverFrame(
  ctx:       CanvasRenderingContext2D,
  w:         number,
  h:         number,
  gameState: GameState,
  ui:        GameOverState | null,
): void {
  if (!ui) return;

  const cx    = w / 2;
  const scale = Math.min(w, h);

  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "#ff4444";
  ctx.font      = `bold ${Math.floor(scale * 0.08)}px Arial`;
  ctx.fillText("GAME OVER", cx, h * 0.2);

  ctx.fillStyle = "#ffffff";
  ctx.font      = `${Math.floor(scale * 0.056)}px Arial`;
  ctx.fillText(`Score: ${gameState.score}`, cx, h * 0.35);

  ctx.fillStyle = "#aaaaaa";
  ctx.font      = `${Math.floor(scale * 0.04)}px Arial`;
  ctx.fillText(`Time: ${Math.floor(gameState.elapsedTime)}s`, cx, h * 0.45);

  if (ui.isNewHigh) {
    ctx.fillStyle = "#ffcc00";
    ctx.font      = `bold ${Math.floor(scale * 0.048)}px Arial`;
    ctx.fillText("NEW HIGH SCORE!", cx, h * 0.55);
  }

  ctx.fillStyle = ui.playHovered ? "#00ff88" : "#00cc66";
  ctx.font      = `bold ${Math.floor(scale * 0.056)}px Arial`;
  ctx.fillText("PLAY AGAIN", cx, h * 0.7);

  ctx.fillStyle = ui.menuHovered ? "#bbbbbb" : "#888888";
  ctx.font      = `${Math.floor(scale * 0.04)}px Arial`;
  ctx.fillText("MENU", cx, h * 0.8);
}
