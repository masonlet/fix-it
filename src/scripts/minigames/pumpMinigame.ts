import { isPointerDown, wasPointerClicked, wasPointerReleased, pointerY } from "web-engine/input/pointer.ts";
import { playSound, stopSound } from "web-engine/audio/playback.ts";
import type { GameAssets } from "../game/assets.ts";

const TUNING = { REQUIRED_DISTANCE_MULT: 4 };

const LAYOUT = {
  NARROW_WIDTH:             650,
  PUMP_WIDTH_PCT:           0.20,
  PUMP_HEIGHT_PCT:          0.40,
  HANDLE_HEIGHT_PCT:        0.065,
  HANDLE_WIDTH_PCT:         0.70,
  BAR_WIDTH_PCT:            0.08,
  BAR_INSET_PCT:            0.85,
  HANDLE_BOTTOM_LIMIT_PCT:  0.85,
  PUMP_WIDTH_PCT_NARROW:    0.40,
  PUMP_HEIGHT_PCT_NARROW:   0.40,
  HANDLE_HEIGHT_PCT_NARROW: 0.065,
  BAR_WIDTH_PCT_NARROW:     0.15,
};

function computeSizes(w: number, h: number) {
  const narrow    = w < LAYOUT.NARROW_WIDTH;
  const pumpWidth = w * (narrow ? LAYOUT.PUMP_WIDTH_PCT_NARROW : LAYOUT.PUMP_WIDTH_PCT);
  return {
    pumpWidth,
    pumpHeight:   h * (narrow ? LAYOUT.PUMP_HEIGHT_PCT_NARROW   : LAYOUT.PUMP_HEIGHT_PCT),
    handleWidth:  pumpWidth * LAYOUT.HANDLE_WIDTH_PCT,
    handleHeight: h * (narrow ? LAYOUT.HANDLE_HEIGHT_PCT_NARROW : LAYOUT.HANDLE_HEIGHT_PCT),
    barWidth:     w * (narrow ? LAYOUT.BAR_WIDTH_PCT_NARROW     : LAYOUT.BAR_WIDTH_PCT),
  };
}

function computeLayout(w: number, h: number) {
  const cx = w / 2, cy = h / 2;
  const s  = computeSizes(w, h);
  const pumpX      = cx - (s.pumpWidth + s.barWidth) / 2 + s.pumpWidth / 2;
  const barX       = pumpX + s.pumpWidth / 2 + s.barWidth / 2;
  const pumpTop    = cy - s.pumpHeight / 2;
  const pumpBottom = cy + s.pumpHeight / 2;
  const handleTop  = pumpTop;
  const handleBottom = pumpTop + s.pumpHeight * LAYOUT.HANDLE_BOTTOM_LIMIT_PCT;
  return { cx, cy, pumpX, barX, pumpTop, pumpBottom, handleTop, handleBottom, ...s };
}

export interface PumpState {
  cx:               number;
  cy:               number;
  pumpX:            number;
  barX:             number;
  pumpWidth:        number;
  pumpHeight:       number;
  handleWidth:      number;
  handleHeight:     number;
  barWidth:         number;
  pumpTop:          number;
  pumpBottom:       number;
  handleTop:        number;
  handleBottom:     number;
  handleY:          number;
  lastHandleY:      number | null;
  pumpedDistance:   number;
  requiredDistance: number;
  barPct:           number;
  pointerDown:      boolean;
  arrowsVisible:    boolean;
  arrowTime:        number;
  soundPlaying:     boolean;
  soundIdleTime:    number;
  completed:        boolean;
}

export function createPumpState(w: number, h: number): PumpState {
  const layout  = computeLayout(w, h);
  const handleY = layout.handleTop + layout.handleHeight / 2;
  return {
    ...layout,
    handleY,
    pumpedDistance:   0,
    requiredDistance: layout.pumpHeight * TUNING.REQUIRED_DISTANCE_MULT,
    barPct:           0,
    pointerDown:      false,
    lastHandleY:      null,
    arrowsVisible:    true,
    arrowTime:        0,
    soundPlaying:     false,
    soundIdleTime:    0,
    completed:        false,
  };
}

export function updatePump(state: PumpState, dt: number, onComplete: () => void): PumpState {
  if (state.completed) return state;

  let {
    pointerDown,
    lastHandleY,
    handleY,
    pumpedDistance,
    barPct,
    arrowsVisible,
    arrowTime,
    soundPlaying,
    soundIdleTime
  } = state;

  arrowTime     += dt;
  soundIdleTime += dt;

  if (soundPlaying && soundIdleTime > 0.15) {
    stopSound("pump-down");
    soundPlaying = false;
  }

  if (wasPointerClicked())  { pointerDown = true;  lastHandleY = handleY; }
  if (wasPointerReleased()) { pointerDown = false; lastHandleY = null;    }

  if (pointerDown && isPointerDown()) {
    const py      = pointerY();
    const half    = state.handleHeight / 2;
    const clamped = Math.max(state.handleTop + half, Math.min(state.handleBottom - half, py));

    if (lastHandleY !== null && clamped > lastHandleY) {
      if (arrowsVisible) arrowsVisible = false;
      soundIdleTime = 0;
      if (!soundPlaying) { playSound("pump-down", { loop: true }); soundPlaying = true; }
      pumpedDistance += clamped - lastHandleY;
      barPct = Math.min(1, pumpedDistance / state.requiredDistance);

      if (barPct >= 1) {
        stopSound("pump-down");
        playSound("pump-complete");
        onComplete();
        return {
          ...state,
          handleY: clamped,
          lastHandleY: clamped,
          pumpedDistance,
          barPct,
          arrowsVisible,
          arrowTime,
          soundPlaying: false,
          soundIdleTime,
          completed: true,
          pointerDown
        };
      }
    }
    handleY     = clamped;
    lastHandleY = clamped;
  }

  return {
    ...state,
    handleY,
    lastHandleY,
    pumpedDistance,
    barPct,
    arrowsVisible,
    arrowTime,
    soundPlaying,
    soundIdleTime,
    pointerDown
  };
}

export function resizePump(state: PumpState, w: number, h: number): PumpState {
  const layout = computeLayout(w, h);
  const oldMin = state.handleTop    + state.handleHeight / 2;
  const oldMax = state.handleBottom - state.handleHeight / 2;
  const pct    = oldMax > oldMin ? (state.handleY - oldMin) / (oldMax - oldMin) : 0;
  const newMin = layout.handleTop    + layout.handleHeight / 2;
  const newMax = layout.handleBottom - layout.handleHeight / 2;
  const handleY = newMin + (newMax - newMin) * Math.max(0, Math.min(1, pct));
  return {
    ...state,
    ...layout,
    handleY,
    requiredDistance: layout.pumpHeight * TUNING.REQUIRED_DISTANCE_MULT
  };
}

export function renderPump(ctx: CanvasRenderingContext2D, state: PumpState, assets: GameAssets): void {
  const {
    cy,
    pumpX,
    barX,
    pumpWidth,
    pumpHeight,
    handleWidth,
    handleHeight,
    barWidth,
    handleY,
    barPct,
    arrowsVisible,
    arrowTime,
    pumpBottom
  } = state;

  ctx.drawImage(assets.minigames.pump.body,  pumpX - pumpWidth/2, cy - pumpHeight/2, pumpWidth, pumpHeight);
  ctx.drawImage(assets.game.rectBorder,      barX  - barWidth/2,  cy - pumpHeight/2, barWidth,  pumpHeight);

  const fillH = pumpHeight * LAYOUT.BAR_INSET_PCT * barPct;
  if (fillH > 0) ctx.drawImage(assets.game.rectInsertFixed,
                              barX - barWidth * LAYOUT.BAR_INSET_PCT / 2,
                              pumpBottom - fillH,
                              barWidth * LAYOUT.BAR_INSET_PCT,
                              fillH
  );

  ctx.fillStyle = "#666666";
  ctx.fillRect(pumpX - handleWidth/2, handleY - handleHeight/2, handleWidth, handleHeight);
  ctx.drawImage(assets.game.rectBorder, pumpX - handleWidth/2, handleY - handleHeight/2, handleWidth, handleHeight);

  if (arrowsVisible) {
    const arrowSize = pumpWidth * 0.15;
    const arrowX    = pumpX - pumpWidth / 2 - arrowSize * 1.5;
    const upAlpha   = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(arrowTime * Math.PI * 2 / 1.2));
    const downAlpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(arrowTime * Math.PI * 2 / 1.2 + Math.PI));

    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = upAlpha;
    ctx.beginPath();
    ctx.moveTo(arrowX + arrowSize/2, cy - arrowSize * 2);
    ctx.lineTo(arrowX, cy - arrowSize);
    ctx.lineTo(arrowX + arrowSize, cy - arrowSize);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = downAlpha;
    ctx.beginPath();
    ctx.moveTo(arrowX, cy + arrowSize);
    ctx.lineTo(arrowX + arrowSize, cy + arrowSize);
    ctx.lineTo(arrowX + arrowSize/2, cy + arrowSize * 2);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}
