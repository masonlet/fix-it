import {
  isPointerDown,
  wasPointerClicked,
  wasPointerReleased,
  pointerX,
  pointerY
} from "web-engine/input/pointer.ts";
import { playSound       } from "web-engine/audio/playback.ts";
import { tintImage       } from "web-engine/assets.ts";
import type { GameAssets } from "../game/assets.ts";


const LAYOUT = {
  BG_SIZE_PCT:         0.50,
  PIECE_SIZE_PCT:      0.10,
  SLOT_SIZE_PCT:       0.12,
  START_OFFSET_X_PCT: -0.15,
  SLOT_OFFSET_X_PCT:   0.15,
  SNAP_TOLERANCE_PCT:  0.50,
}

export interface DragState {
  completed:       boolean;
  dragging:        boolean;
  dragOffsetX:     number;
  dragOffsetY:     number;
  pieceX:          number;
  pieceY:          number;
  startX:          number;
  startY:          number;
  slotX:           number;
  slotY:           number;
  snapTolerance:   number;
  slotHighlighted: boolean;
  bgSize:          number;
  pieceSize:       number;
  slotSize:        number;
  cx:              number;
  cy:              number;
  slotTinted:      HTMLCanvasElement;
}

export function createDragState(w: number, h: number, assets: GameAssets): DragState {
  const cx        = w / 2;
  const cy        = h / 2;
  const bgSize    = w * LAYOUT.BG_SIZE_PCT;
  const pieceSize = w * LAYOUT.PIECE_SIZE_PCT;
  const slotSize  = w * LAYOUT.SLOT_SIZE_PCT;
  const startX    = cx + w * LAYOUT.START_OFFSET_X_PCT;
  const slotX     = cx + w * LAYOUT.SLOT_OFFSET_X_PCT;

  return {
    completed: false, dragging: false,
    dragOffsetX: 0, dragOffsetY: 0,
    pieceX: startX, pieceY: cy,
    startX, startY: cy,
    slotX, slotY: cy,
    snapTolerance: pieceSize * LAYOUT.SNAP_TOLERANCE_PCT,
    slotHighlighted: false,
    bgSize, pieceSize, slotSize, cx, cy,
    slotTinted: tintImage(assets.minigames.drag.socket, "#00cc66"),
  };
}

function hitPiece(state: DragState): boolean {
  const half = state.pieceSize / 2;
  const px = pointerX(), py = pointerY();
  return px >= state.pieceX - half && px <= state.pieceX + half
      && py >= state.pieceY - half && py <= state.pieceY + half;
}

export function updateDrag(state: DragState, onComplete: () => void): DragState {
  if (state.completed) return state;
  const px = pointerX(), py = pointerY();

  if (!state.dragging && wasPointerClicked() && hitPiece(state))
    return {
      ...state,
      dragging: true,
      dragOffsetX: px - state.pieceX,
      dragOffsetY: py - state.pieceY
    };

  if (state.dragging && isPointerDown()) {
    const pieceX = px - state.dragOffsetX;
    const pieceY = py - state.dragOffsetY;
    return {
      ...state,
      pieceX,
      pieceY,
      slotHighlighted: Math.hypot(pieceX - state.slotX, pieceY - state.slotY) <= state.snapTolerance
    };
  }

  if (state.dragging && wasPointerReleased()) {
    const snapped = Math.hypot(state.pieceX - state.slotX, state.pieceY - state.slotY) <= state.snapTolerance;
    if (snapped) {
      playSound("drag-connect");
      onComplete();
      return {
        ...state,
        dragging: false,
        completed: true,
        slotHighlighted: false,
        pieceX: state.slotX,
        pieceY: state.slotY
      };
    }
    return {
      ...state,
      dragging: false,
      slotHighlighted: false,
      pieceX: state.startX,
      pieceY: state.startY
    };
  }

  return state;
}

export function resizeDrag(state: DragState, w: number, h: number): DragState {
  const cx        = w / 2;
  const cy        = h / 2;
  const bgSize    = w * LAYOUT.BG_SIZE_PCT;
  const pieceSize = w * LAYOUT.PIECE_SIZE_PCT;
  const slotSize  = w * LAYOUT.SLOT_SIZE_PCT;
  const startX    = cx + w * LAYOUT.START_OFFSET_X_PCT;
  const slotX     = cx + w * LAYOUT.SLOT_OFFSET_X_PCT;

  return {
    ...state, cx, cy, bgSize, pieceSize, slotSize,
    startX, startY: cy, slotX, slotY: cy,
    snapTolerance: pieceSize * LAYOUT.SNAP_TOLERANCE_PCT,
    pieceX: state.completed ? slotX : startX,
    pieceY: cy,
  };
}

function drawCentered(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLCanvasElement,
  x: number, y: number, w: number, h: number,
): void {
  ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
}

export function renderDrag(ctx: CanvasRenderingContext2D, state: DragState, assets: GameAssets): void {
  const { cx, cy, bgSize, slotSize, pieceSize, slotX, slotY, pieceX, pieceY, slotHighlighted } = state;
  drawCentered(ctx, assets.minigames.drag.background, cx, cy, bgSize, bgSize);
  drawCentered(ctx, slotHighlighted ? state.slotTinted : assets.minigames.drag.socket, slotX, slotY, slotSize, slotSize);
  drawCentered(ctx, assets.minigames.drag.plug, pieceX, pieceY, pieceSize, pieceSize);
}
