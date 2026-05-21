import { wasPointerClicked } from "web-engine/input/pointer.ts";
import { playSound         } from "web-engine/audio/playback.ts";
import { YouTubePlayables  } from "../sdk/youTubePlayables.ts";
import type { FrameState, GameState, MainMenuState } from "../game/types.ts";

export function handleMainMenuFrame(dt: number, ui: MainMenuState | null): FrameState {
  const state = ui ?? { pulseTime: 0, gameReadyCalled: false };

  if (!state.gameReadyCalled) YouTubePlayables.gameReady();

  if (wasPointerClicked()) {
    playSound("button");
    return { game: "playing", ui: null };
  }

  return { game: "menu-main", ui: { pulseTime: state.pulseTime + dt, gameReadyCalled: true } };
}

export function renderMainMenuFrame(
  ctx:       CanvasRenderingContext2D,
  w:         number,
  h:         number,
  gameState: GameState,
  ui:        MainMenuState | null,
): void {
  if (!ui) return;

  const cx    = w / 2;
  const scale = Math.min(w, h);

  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "#ffffff";
  ctx.font      = `bold ${Math.floor(scale * 0.12)}px Arial`;
  ctx.fillText("FIX IT!", cx, h * 0.35);

  ctx.fillStyle = "#aaaaaa";
  ctx.font      = `${Math.floor(scale * 0.04)}px Arial`;
  ctx.fillText(`High Score: ${gameState.highScore ?? 0}`, cx, h * 0.5);

  ctx.globalAlpha = 0.65 + 0.35 * Math.sin(ui.pulseTime * Math.PI * 2 / 1.6);
  ctx.fillStyle   = "#00cc66";
  ctx.font        = `bold ${Math.floor(scale * 0.06)}px Arial`;
  ctx.fillText("TAP TO START", cx, h * 0.65);
  ctx.globalAlpha = 1;
}
