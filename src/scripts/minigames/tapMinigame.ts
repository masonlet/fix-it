import { wasPointerClicked, pointerX, pointerY } from "web-engine/input/pointer.ts";
import { playSound       } from "web-engine/audio/playback.ts";
import type { GameAssets } from "../game/assets.ts";

const LAYOUT = {
  NARROW_WIDTH:           650,
  BOX_COUNT:              3,
  BG_SIZE_PCT:            0.40,
  BOX_SIZE_PCT:           0.085,
  BOX_SPACING_PCT:        0.10,
  BG_SIZE_PCT_NARROW:     0.70,
  BOX_SIZE_PCT_NARROW:    0.15,
  BOX_SPACING_PCT_NARROW: 0.18,
  BUTTON_Y_OFFSET_PCT:    0.15,
};

interface TapBox { x: number; y: number; fixed: boolean; }

export interface TapState {
  cx: number; cy: number;
  bgSize: number; boxSize: number; spacing: number; buttonY: number;
  remaining: number;
  boxes: TapBox[];
}

function computeSizes(w: number) {
  const narrow = w < LAYOUT.NARROW_WIDTH;
  return {
    bgSize:  w * (narrow ? LAYOUT.BG_SIZE_PCT_NARROW  : LAYOUT.BG_SIZE_PCT),
    boxSize: w * (narrow ? LAYOUT.BOX_SIZE_PCT_NARROW : LAYOUT.BOX_SIZE_PCT),
    spacing: w * (narrow ? LAYOUT.BOX_SPACING_PCT_NARROW : LAYOUT.BOX_SPACING_PCT),
  };
}

export function createTapState(w: number, h: number): TapState {
  const cx = w / 2, cy = h / 2;
  const { bgSize, boxSize, spacing } = computeSizes(w);
  const startX  = cx - spacing * (LAYOUT.BOX_COUNT - 1) / 2;
  const buttonY = cy + bgSize * LAYOUT.BUTTON_Y_OFFSET_PCT;
  const boxes   = Array.from({ length: LAYOUT.BOX_COUNT }, (_, i) => ({
    x: startX + i * spacing, y: buttonY, fixed: false,
  }));
  return { cx, cy, bgSize, boxSize, spacing, buttonY, remaining: LAYOUT.BOX_COUNT, boxes };
}

export function updateTap(state: TapState, onComplete: () => void): TapState {
  if (!wasPointerClicked()) return state;
  const px = pointerX(), py = pointerY();
  let remaining = state.remaining;
  let completed = false;

  const boxes = state.boxes.map(box => {
    if (box.fixed) return box;
    const half = state.boxSize / 2;
    if (px < box.x - half || px > box.x + half || py < box.y - half || py > box.y + half) return box;
    playSound("tap-button");
    remaining--;
    if (remaining <= 0) completed = true;
    return { ...box, fixed: true };
  });

  if (completed) { playSound("tap-complete"); onComplete(); }
  return { ...state, boxes, remaining };
}

export function resizeTap(state: TapState, w: number, h: number): TapState {
  const cx = w / 2, cy = h / 2;
  const { bgSize, boxSize, spacing } = computeSizes(w);
  const startX  = cx - spacing * (LAYOUT.BOX_COUNT - 1) / 2;
  const buttonY = cy + bgSize * LAYOUT.BUTTON_Y_OFFSET_PCT;
  const boxes   = state.boxes.map((box, i) => ({ ...box, x: startX + i * spacing, y: buttonY }));
  return { ...state, cx, cy, bgSize, boxSize, spacing, buttonY, boxes };
}

export function renderTap(ctx: CanvasRenderingContext2D, state: TapState, assets: GameAssets): void {
  const { cx, cy, bgSize, boxSize, boxes } = state;
  ctx.drawImage(assets.minigames.tap.walkieClose, cx - bgSize/2, cy - bgSize/2, bgSize, bgSize);
  for (const box of boxes) {
    const insert = box.fixed ? assets.game.squareInsertFixed : assets.game.squareInsertFault;
    ctx.drawImage(insert,                  box.x - boxSize/2, box.y - boxSize/2, boxSize, boxSize);
    ctx.drawImage(assets.game.squareBorder, box.x - boxSize/2, box.y - boxSize/2, boxSize, boxSize);
  }
}
