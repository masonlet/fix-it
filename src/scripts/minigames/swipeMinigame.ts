import { isPointerDown, wasPointerClicked, wasPointerReleased, pointerY } from "web-engine/input/pointer.ts";
import { playSound } from "web-engine/audio/playback.ts";
import type { GameAssets } from "../game/assets.ts";

const LAYOUT = {
  NARROW_WIDTH:           650,
  ARROW_SIZE_PCT:         0.05,
  SOCKET_Y_PCT:           0.45,
  NEW_BULB_Y_PCT:         0.85,
  LAMP_WIDTH_PCT:         0.40,
  LAMP_HEIGHT_PCT:        0.60,
  BULB_SIZE_PCT:          0.24,
  LAMP_WIDTH_PCT_NARROW:  0.70,
  LAMP_HEIGHT_PCT_NARROW: 0.40,
  BULB_SIZE_PCT_NARROW:   0.50,
};

const TUNING = {
  SWIPE_THRESHOLD_PCT:  0.15,
  ANIM_DURATION:        0.3,
  BOUNCE_AMPLITUDE_PCT: 0.015,
  BOUNCE_PERIOD:        1.0,
};

function computeSizes(w: number, h: number) {
  const narrow = w < LAYOUT.NARROW_WIDTH;
  return {
    lampWidth:  w * (narrow ? LAYOUT.LAMP_WIDTH_PCT_NARROW  : LAYOUT.LAMP_WIDTH_PCT),
    lampHeight: h * (narrow ? LAYOUT.LAMP_HEIGHT_PCT_NARROW : LAYOUT.LAMP_HEIGHT_PCT),
    bulbSize:   w * (narrow ? LAYOUT.BULB_SIZE_PCT_NARROW   : LAYOUT.BULB_SIZE_PCT),
  };
}

type SwipePhase = "remove" | "removing" | "insert" | "inserting" | "done";

export interface SwipeState {
  cx:           number;
  cy:           number;
  h:            number;
  lampWidth:    number;
  lampHeight:   number;
  bulbSize:     number;
  arrowSize:    number;
  threshold:    number;
  socketY:      number;
  newBulbY:     number;
  phase:        SwipePhase;
  bulbY:        number;
  animFrom:     number;
  animTo:       number;
  animTime:     number;
  pieceOffset:  number;
  pointerDown:  boolean;
  lastY:        number | null;
  arrowsVisible: boolean;
  arrowTime:    number;
}

export function createSwipeState(w: number, h: number): SwipeState {
  const { lampWidth, lampHeight, bulbSize } = computeSizes(w, h);
  const socketY  = h * LAYOUT.SOCKET_Y_PCT;
  const newBulbY = h * LAYOUT.NEW_BULB_Y_PCT;
  return {
    cx: w / 2, cy: h / 2, h,
    lampWidth, lampHeight, bulbSize,
    arrowSize:    w * LAYOUT.ARROW_SIZE_PCT,
    threshold:    h * TUNING.SWIPE_THRESHOLD_PCT,
    socketY, newBulbY,
    phase:        "remove",
    bulbY:        socketY,
    animFrom:     socketY,
    animTo:       socketY,
    animTime:     0,
    pieceOffset:  0,
    pointerDown:  false,
    lastY:        null,
    arrowsVisible: true,
    arrowTime:    0,
  };
}

export function updateSwipe(state: SwipeState, dt: number, onComplete: () => void): SwipeState {
  if (state.phase === "done") return state;

  let {
    phase,
    bulbY,
    animFrom,
    animTo,
    animTime,
    pieceOffset,
    pointerDown,
    lastY,
    arrowsVisible,
    arrowTime
  } = state;

  arrowTime += dt;

  if (phase === "removing") {
    animTime += dt;
    bulbY = animFrom + (animTo - animFrom) * Math.min(1, animTime / TUNING.ANIM_DURATION);
    if (animTime >= TUNING.ANIM_DURATION) return {
      ...state,
      phase: "insert",
      bulbY: state.newBulbY,
      animTime: 0,
      pieceOffset: 0,
      arrowsVisible: true,
      arrowTime: 0
    };
    return { ...state, bulbY, animTime };
  }

  if (phase === "inserting") {
    animTime += dt;
    bulbY = animFrom + (animTo - animFrom) * Math.min(1, animTime / TUNING.ANIM_DURATION);
    if (animTime >= TUNING.ANIM_DURATION) {
      playSound("swipe-complete");
      onComplete();
      return { ...state, phase: "done", bulbY: state.socketY };
    }
    return { ...state, bulbY, animTime };
  }

  if (wasPointerClicked()) { pointerDown = true;  lastY = pointerY(); }
  if (wasPointerReleased()) { pointerDown = false; lastY = null; }

  if (pointerDown && isPointerDown() && lastY !== null) {
    const py    = pointerY();
    const delta = py - lastY;
    const valid = phase === "remove" ? delta > 0 : delta < 0;

    if (valid) {
      pieceOffset += Math.abs(delta);
      bulbY += delta;
      if (arrowsVisible) arrowsVisible = false;

      if (pieceOffset >= state.threshold) {
        playSound("swipe-move");
        if (phase === "remove") return {
          ...state,
          phase: "removing",
          bulbY,
          animFrom: bulbY,
          animTo: state.h + state.bulbSize,
          animTime: 0,
          pieceOffset,
          pointerDown: false,
          lastY: null,
          arrowsVisible,
          arrowTime
        };
        else return { 
          ...state,
          phase: "inserting",
          bulbY,
          animFrom: bulbY,
          animTo: state.socketY,
          animTime: 0,
          pieceOffset,
          pointerDown: false,
          lastY: null,
          arrowsVisible,
          arrowTime
        };
      }
    }
    lastY = py;
  }

  return { ...state, bulbY, pieceOffset, pointerDown, lastY, arrowsVisible, arrowTime };
}

export function resizeSwipe(state: SwipeState, w: number, h: number): SwipeState {
  const { lampWidth, lampHeight, bulbSize } = computeSizes(w, h);
  return {
    ...state,
    cx: w / 2, cy: h / 2, h,
    lampWidth, lampHeight, bulbSize,
    arrowSize: w * LAYOUT.ARROW_SIZE_PCT,
    threshold: h * TUNING.SWIPE_THRESHOLD_PCT,
    socketY:   h * LAYOUT.SOCKET_Y_PCT,
    newBulbY:  h * LAYOUT.NEW_BULB_Y_PCT,
  };
}

export function renderSwipe(ctx: CanvasRenderingContext2D, state: SwipeState, assets: GameAssets): void {
  if (state.phase === "done") return;

  const {
    cx,
    cy,
    lampWidth,
    lampHeight,
    bulbSize,
    arrowSize,
    bulbY,
    phase,
    arrowsVisible,
    arrowTime,
    h
  } = state;

  ctx.drawImage(assets.minigames.swipe.light, cx - lampWidth/2, cy - lampHeight/2, lampWidth, lampHeight);

  const isFixed      = phase === "insert" || phase === "inserting";
  const insertImg    = isFixed ? assets.minigames.swipe.bulbInsertFixed : assets.minigames.swipe.bulbInsertBroken;
  ctx.drawImage(insertImg,                    cx - bulbSize/2, bulbY - bulbSize/2, bulbSize, bulbSize);
  ctx.drawImage(assets.minigames.swipe.bulb,  cx - bulbSize/2, bulbY - bulbSize/2, bulbSize, bulbSize);

  if (arrowsVisible && (phase === "remove" || phase === "insert")) {
    const direction   = phase === "remove" ? 1 : -1;
    const arrowColor  = phase === "remove" ? "#aa2222" : "#007733";
    const bounceAmp   = h * TUNING.BOUNCE_AMPLITUDE_PCT;
    const bounce      = bounceAmp * Math.sin(arrowTime * Math.PI * 2 / TUNING.BOUNCE_PERIOD) * direction;
    const spacing     = arrowSize * 0.8;
    const arrowBaseY  = direction > 0
      ? bulbY + bulbSize/2 + arrowSize + bounce
      : bulbY - bulbSize/2 - arrowSize + bounce;

    ctx.fillStyle = arrowColor;
    for (let i = 0; i < 3; i++) {
      const oy = i * spacing * direction;
      ctx.beginPath();
      if (direction > 0) {
        ctx.moveTo(cx,              arrowBaseY + oy + arrowSize);
        ctx.lineTo(cx - arrowSize/2, arrowBaseY + oy);
        ctx.lineTo(cx + arrowSize/2, arrowBaseY + oy);
      } else {
        ctx.moveTo(cx,              arrowBaseY + oy - arrowSize);
        ctx.lineTo(cx - arrowSize/2, arrowBaseY + oy);
        ctx.lineTo(cx + arrowSize/2, arrowBaseY + oy);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
}
