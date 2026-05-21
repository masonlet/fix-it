import { wasPointerClicked } from "web-engine/input/pointer.ts";
import { playSound          } from "web-engine/audio/playback.ts";
import type { GameAssets    } from "../game/assets.ts";

const LAYOUT = {
  GAUGE_SIZE_MULT:   2.4,
  ZONE_ARC_DEG:      60,
  RADIUS_PCT:        0.18,
  THICKNESS_PCT:     0.015,
  NEEDLE_LENGTH_PCT: 0.16,
  NEEDLE_WIDTH_PCT:  0.01,
};
const TUNING = {
  HITS_REQUIRED:            3,
  MISSES_ALLOWED:           3,
  NEEDLE_SPEED_DEG_PER_SEC: 300,
};

function degToRad(deg: number): number { return deg * Math.PI / 180; }

function generateZones(count: number): Array<{ center: number }> {
  const zones: Array<{ center: number }> = [];
  const minGap = LAYOUT.ZONE_ARC_DEG + 10;
  let attempts = 0;
  while (zones.length < count && attempts < 50) {
    const center = Math.random() * 360;
    const overlaps = zones.some(z => {
      let d = Math.abs(z.center - center);
      if (d > 180) d = 360 - d;
      return d < minGap;
    });
    if (!overlaps) zones.push({ center });
    attempts++;
  }
  return zones;
}

export interface TimingState {
  cx:           number;
  cy:           number;
  radius:       number;
  thickness:    number;
  needleLength: number;
  needleWidth:  number;
  gaugeSize:    number;
  needleAngle:  number;
  zones:        Array<{ center: number }>;
  zonesCleared: boolean[];
  hits:         number;
  misses:       number;
  acceptInput:  boolean;
  completed:    boolean;
  failed:       boolean;
}

export function createTimingState(w: number, h: number): TimingState {
  const radius = w * LAYOUT.RADIUS_PCT;
  const zones  = generateZones(TUNING.HITS_REQUIRED);
  return {
    cx: w / 2, cy: h / 2,
    radius,
    thickness:    w * LAYOUT.THICKNESS_PCT,
    needleLength: w * LAYOUT.NEEDLE_LENGTH_PCT,
    needleWidth:  w * LAYOUT.NEEDLE_WIDTH_PCT,
    gaugeSize:    radius * LAYOUT.GAUGE_SIZE_MULT,
    needleAngle:  0,
    zones,
    zonesCleared: zones.map(() => false),
    hits:         0,
    misses:       0,
    acceptInput:  true,
    completed:    false,
    failed:       false,
  };
}

export function updateTiming(
  state:      TimingState,
  dt:         number,
  onComplete: () => void,
  onFail:     () => void,
): TimingState {
  if (!state.acceptInput) return state;

  const needleAngle = (state.needleAngle + TUNING.NEEDLE_SPEED_DEG_PER_SEC * dt) % 360;
  if (!wasPointerClicked()) return { ...state, needleAngle };

  playSound("timing-click");

  const half = LAYOUT.ZONE_ARC_DEG / 2;
  let hitIndex = -1;
  state.zones.forEach((z, i) => {
    if (state.zonesCleared[i]) return;
    let delta = Math.abs(z.center - needleAngle);
    if (delta > 180) delta = 360 - delta;
    if (delta <= half) hitIndex = i;
  });

  if (hitIndex >= 0) {
    const zonesCleared = [...state.zonesCleared];
    zonesCleared[hitIndex] = true;
    const hits = state.hits + 1;
    if (hits >= TUNING.HITS_REQUIRED) {
      playSound("timing-complete");
      onComplete();
      return { ...state, needleAngle, zonesCleared, hits, acceptInput: false, completed: true };
    }
    return { ...state, needleAngle, zonesCleared, hits };
  }

  const misses = state.misses + 1;
  if (misses >= TUNING.MISSES_ALLOWED) {
    onFail();
    return { ...state, needleAngle, misses, acceptInput: false, failed: true };
  }
  return { ...state, needleAngle, misses };
}

export function resizeTiming(state: TimingState, w: number, h: number): TimingState {
  const radius = w * LAYOUT.RADIUS_PCT;
  return {
    ...state,
    cx: w / 2, cy: h / 2, radius,
    thickness:    w * LAYOUT.THICKNESS_PCT,
    needleLength: w * LAYOUT.NEEDLE_LENGTH_PCT,
    needleWidth:  w * LAYOUT.NEEDLE_WIDTH_PCT,
    gaugeSize:    radius * LAYOUT.GAUGE_SIZE_MULT,
  };
}

export function renderTiming(
  ctx: CanvasRenderingContext2D,
  state: TimingState,
  assets: GameAssets
): void {
  const {
    cx,
    cy,
    radius,
    thickness,
    needleLength,
    needleWidth,
    gaugeSize,
    needleAngle,
    zones,
    zonesCleared
  } = state;

  ctx.drawImage(assets.minigames.timing.gauge, cx - gaugeSize/2, cy - gaugeSize/2, gaugeSize, gaugeSize);

  ctx.strokeStyle = "#00cc66";
  ctx.lineWidth   = thickness;
  for (let i = 0; i < zones.length; i++) {
    if (zonesCleared[i]) continue;
    const half = LAYOUT.ZONE_ARC_DEG / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, degToRad(zones[i]!.center - half), degToRad(zones[i]!.center + half));
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(degToRad(needleAngle + 90));
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-needleWidth/2, -needleLength, needleWidth, needleLength);
  ctx.restore();
}
