import { playSound } from "web-engine/audio/playback.ts";
import type { GameState, ActiveItem, InnerMinigame } from "./types.ts";
import type { GameAssets                           } from "./assets.ts";
import { POPUP                                     } from "../config/popup.ts";
import { TIMER                                     } from "../config/timer.ts";
import { MINIGAME_TYPES                            } from "../config/minigameTypes.ts";
import { createDragState,   updateDrag,   resizeDrag,   renderDrag   } from "../minigames/dragMinigame.ts";
import { createTapState,    updateTap,    resizeTap,    renderTap    } from "../minigames/tapMinigame.ts";
import { createPumpState,   updatePump,   resizePump,   renderPump   } from "../minigames/pumpMinigame.ts";
import { createSpinState,   updateSpin,   resizeSpin,   renderSpin   } from "../minigames/spinMinigame.ts";
import { createSwipeState,  updateSwipe,  resizeSwipe,  renderSwipe  } from "../minigames/swipeMinigame.ts";
import { createTimingState, updateTiming, resizeTiming, renderTiming } from "../minigames/timingMinigame.ts";

function hexColor(n: number): string { return `#${n.toString(16).padStart(6, "0")}`; }

export function openMinigame(
  gameState: GameState,
  item: ActiveItem,
  assets: GameAssets,
  w: number, h: number
): void {
  playSound("click");
  item.paused = true;

  const faultType = item.faultTypes[item.totalFaults - item.faults] ?? "";
  let inner: InnerMinigame;
  switch (faultType) {
    case MINIGAME_TYPES.DRAG:   inner = { type: "drag",   state: createDragState  (w, h, assets) }; break;
    case MINIGAME_TYPES.TAP:    inner = { type: "tap",    state: createTapState   (w, h)         }; break;
    case MINIGAME_TYPES.PUMP:   inner = { type: "pump",   state: createPumpState  (w, h)         }; break;
    case MINIGAME_TYPES.SPIN:   inner = { type: "spin",   state: createSpinState  (w, h)         }; break;
    case MINIGAME_TYPES.SWIPE:  inner = { type: "swipe",  state: createSwipeState (w, h)         }; break;
    case MINIGAME_TYPES.TIMING: inner = { type: "timing", state: createTimingState(w, h)         }; break;
    default: return;
  }

  gameState.minigame = {
    item,
    timeLeft: gameState.minigameTimeMax,
    timeMax: gameState.minigameTimeMax,
    inner
  };
}

function fixMinigame(gameState: GameState, onFixed: (item: ActiveItem) => void): void {
  const mg = gameState.minigame;
  if (!mg) return;
  const item = mg.item;
  item.faults--;
  const fixedIndex = item.totalFaults - item.faults - 1;
  if (item.indicators[fixedIndex]) item.indicators[fixedIndex]!.fixed = true;
  if (item.faults <= 0) onFixed(item);
  else item.paused = false;
  closeMinigame(gameState);
}

export function failMinigame(gameState: GameState): void {
  const mg = gameState.minigame;
  if (!mg) return;
  playSound("minigame-fail");
  mg.item.paused = false;
  closeMinigame(gameState);
}

export function closeMinigame(gameState: GameState): void {
  gameState.minigame = null;
}

export function updateMinigame(
  gameState: GameState,
  dt:        number,
  onFixed:   (item: ActiveItem) => void,
): void {
  const mg = gameState.minigame;
  if (!mg) return;

  mg.timeLeft -= dt;
  if (mg.timeLeft <= 0) { failMinigame(gameState); return; }

  const onComplete = () => fixMinigame(gameState, onFixed);
  const onFail     = () => failMinigame(gameState);
  const inner      = mg.inner;

  switch (inner.type) {
    case "drag":   mg.inner = { type: "drag",   state: updateDrag  (inner.state, onComplete)             }; break;
    case "tap":    mg.inner = { type: "tap",    state: updateTap   (inner.state, onComplete)             }; break;
    case "pump":   mg.inner = { type: "pump",   state: updatePump  (inner.state, dt, onComplete)         }; break;
    case "spin":   mg.inner = { type: "spin",   state: updateSpin  (inner.state, dt, onComplete)         }; break;
    case "swipe":  mg.inner = { type: "swipe",  state: updateSwipe (inner.state, dt, onComplete)         }; break;
    case "timing": mg.inner = { type: "timing", state: updateTiming(inner.state, dt, onComplete, onFail) }; break;
  }
}

export function resizeMinigame(gameState: GameState, w: number, h: number): void {
  const mg = gameState.minigame;
  if (!mg) return;
  const inner = mg.inner;
  switch (inner.type) {
    case "drag":   mg.inner = { type: "drag",   state: resizeDrag  (inner.state, w, h) }; break;
    case "tap":    mg.inner = { type: "tap",    state: resizeTap   (inner.state, w, h) }; break;
    case "pump":   mg.inner = { type: "pump",   state: resizePump  (inner.state, w, h) }; break;
    case "spin":   mg.inner = { type: "spin",   state: resizeSpin  (inner.state, w, h) }; break;
    case "swipe":  mg.inner = { type: "swipe",  state: resizeSwipe (inner.state, w, h) }; break;
    case "timing": mg.inner = { type: "timing", state: resizeTiming(inner.state, w, h) }; break;
  }
}

export function renderMinigame(
  ctx:       CanvasRenderingContext2D,
  gameState: GameState,
  assets:    GameAssets,
  w:         number,
  h:         number,
): void {
  const mg = gameState.minigame;
  if (!mg) return;

  ctx.fillStyle = `rgba(0,0,0,${POPUP.COLOUR.OVERLAY_ALPHA})`;
  ctx.fillRect(0, 0, w, h);

  const barW = w * TIMER.LAYOUT.BAR_WIDTH_PCT;
  const barH = h * TIMER.LAYOUT.BAR_HEIGHT_PCT;
  const barY = h - h * TIMER.LAYOUT.BAR_Y_OFFSET_PCT;
  const barX = w / 2 - barW / 2;
  const pct  = Math.max(0, mg.timeLeft / mg.timeMax);

  ctx.fillStyle = hexColor(TIMER.COLOUR.BG_FILL);
  ctx.fillRect(barX, barY - barH/2, barW, barH);
  ctx.strokeStyle = hexColor(TIMER.COLOUR.BG_STROKE);
  ctx.lineWidth = TIMER.LAYOUT.BAR_STROKE_WIDTH;
  ctx.strokeRect(barX, barY - barH/2, barW, barH);
  ctx.fillStyle = hexColor(TIMER.COLOUR.BAR_FILL);
  ctx.fillRect(barX, barY - barH/2, barW * pct, barH);

  const inner = mg.inner;
  switch (inner.type) {
    case "drag":   renderDrag  (ctx, inner.state, assets); break;
    case "tap":    renderTap   (ctx, inner.state, assets); break;
    case "pump":   renderPump  (ctx, inner.state, assets); break;
    case "spin":   renderSpin  (ctx, inner.state, assets); break;
    case "swipe":  renderSwipe (ctx, inner.state, assets); break;
    case "timing": renderTiming(ctx, inner.state, assets); break;
  }
}
