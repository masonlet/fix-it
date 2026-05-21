import { isPointerDown, wasPointerClicked, wasPointerReleased, pointerX, pointerY } from "web-engine/input/pointer.ts";
import { playSound, stopSound } from "web-engine/audio/playback.ts";
import type { GameAssets      } from "../game/assets.ts";

const TUNING = { REQUIRED_ROTATION_DEG: 2000 };

const LAYOUT = {
  NARROW_WIDTH:              650,
  PIPE_SIZE_PCT:             0.40,
  VALVE_SIZE_PCT:            0.40,
  RING_RADIUS_PCT:           0.15,
  RING_THICKNESS_PCT:        0.015,
  PIPE_SIZE_PCT_NARROW:      0.80,
  VALVE_SIZE_PCT_NARROW:     0.80,
  RING_RADIUS_PCT_NARROW:    0.28,
  RING_THICKNESS_PCT_NARROW: 0.025,
};

function computeSizes(w: number) {
  const narrow = w < LAYOUT.NARROW_WIDTH;
  return {
    pipeSize:      w * (narrow ? LAYOUT.PIPE_SIZE_PCT_NARROW      : LAYOUT.PIPE_SIZE_PCT),
    valveSize:     w * (narrow ? LAYOUT.VALVE_SIZE_PCT_NARROW     : LAYOUT.VALVE_SIZE_PCT),
    ringRadius:    w * (narrow ? LAYOUT.RING_RADIUS_PCT_NARROW    : LAYOUT.RING_RADIUS_PCT),
    ringThickness: w * (narrow ? LAYOUT.RING_THICKNESS_PCT_NARROW : LAYOUT.RING_THICKNESS_PCT),
  };
}

export interface SpinState {
  cx:             number;
  cy:             number;
  pipeSize:       number;
  valveSize:      number;
  ringRadius:     number;
  ringThickness:  number;
  accumulatedDeg: number;
  valveAngle:     number;
  lastAngle:      number | null;
  pointerDown:    boolean;
  completed:      boolean;
  hintVisible:    boolean;
  hintTime:       number;
  soundPlaying:   boolean;
  soundIdleTime:  number;
}

export function createSpinState(w: number, h: number): SpinState {
  return {
    cx: w / 2, cy: h / 2, ...computeSizes(w),
    accumulatedDeg: 0, valveAngle: 0, lastAngle: null,
    pointerDown: false, completed: false,
    hintVisible: true, hintTime: 0,
    soundPlaying: false, soundIdleTime: 0,
  };
}

export function updateSpin(state: SpinState, dt: number, onComplete: () => void): SpinState {
  if (state.completed) return state;

  let {
    pointerDown,
    lastAngle,
    accumulatedDeg,
    valveAngle,
    hintVisible,
    hintTime,
    soundPlaying,
    soundIdleTime
  } = state;

  hintTime      += dt;
  soundIdleTime += dt;

  if (soundPlaying && soundIdleTime > 0.15) { stopSound("spin-spin"); soundPlaying = false; }

  if (wasPointerClicked()) {
    pointerDown = true;
    lastAngle   = Math.atan2(pointerY() - state.cy, pointerX() - state.cx);
  }
  if (wasPointerReleased()) { pointerDown = false; lastAngle = null; }

  if (pointerDown && isPointerDown() && lastAngle !== null) {
    const angle = Math.atan2(pointerY() - state.cy, pointerX() - state.cx);
    let delta = angle - lastAngle;
    if (delta >  Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;

    if (delta > 0) {
      if (hintVisible) hintVisible = false;
      soundIdleTime = 0;
      if (!soundPlaying) { playSound("spin-spin", { loop: true }); soundPlaying = true; }
      accumulatedDeg += delta * 180 / Math.PI;
      valveAngle     += delta;

      if (accumulatedDeg >= TUNING.REQUIRED_ROTATION_DEG) {
        stopSound("spin-spin");
        playSound("spin-complete");
        onComplete();
        return {
          ...state,
          accumulatedDeg,
          valveAngle,
          lastAngle: angle,
          pointerDown,
          hintVisible,
          hintTime,
          soundPlaying: false,
          soundIdleTime,
          completed: true
        };
      }
    }
    lastAngle = angle;
  }

  return {
    ...state,
    pointerDown,
    lastAngle,
    accumulatedDeg,
    valveAngle,
    hintVisible,
    hintTime,
    soundPlaying,
    soundIdleTime
  };
}

export function resizeSpin(state: SpinState, w: number, h: number): SpinState {
  return { ...state, cx: w / 2, cy: h / 2, ...computeSizes(w) };
}

export function renderSpin(ctx: CanvasRenderingContext2D, state: SpinState, assets: GameAssets): void {
  const {
    cx,
    cy,
    pipeSize,
    valveSize,
    ringRadius,
    ringThickness,
    accumulatedDeg,
    valveAngle,
    hintVisible,
    hintTime
  } = state;
  const pct = Math.min(1, accumulatedDeg / TUNING.REQUIRED_ROTATION_DEG);

  ctx.drawImage(assets.minigames.spin.pipe, cx - pipeSize/2, cy - pipeSize/2, pipeSize, pipeSize);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(valveAngle);
  ctx.drawImage(assets.minigames.spin.valve, -valveSize/2, -valveSize/2, valveSize, valveSize);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
  ctx.strokeStyle = "#222222";
  ctx.lineWidth   = ringThickness;
  ctx.stroke();

  if (pct > 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, ringRadius, -Math.PI / 2, -Math.PI / 2 + pct * 2 * Math.PI);
    ctx.strokeStyle = "#00cc66";
    ctx.lineWidth   = ringThickness;
    ctx.stroke();
  }

  if (hintVisible) {
    const hintRadius = ringRadius * 1.3;
    const arrowSize  = ringThickness * 3;
    ctx.globalAlpha  = 0.65 + 0.35 * Math.sin(hintTime * Math.PI * 2 / 1.6);
    ctx.strokeStyle  = "#ffffff";
    ctx.lineWidth    = ringThickness;
    ctx.beginPath();
    ctx.arc(cx, cy, hintRadius, -Math.PI / 2, 0);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(cx + hintRadius, cy + arrowSize);
    ctx.lineTo(cx + hintRadius - arrowSize, cy - arrowSize / 2);
    ctx.lineTo(cx + hintRadius + arrowSize, cy - arrowSize / 2);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
