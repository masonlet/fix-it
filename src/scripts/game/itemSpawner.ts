import { BELT           } from "../config/belt.ts";
import { ITEM           } from "../config/item.ts";
import { GAME           } from "../config/game.ts";
import { INDICATOR      } from "../config/indicator.ts";
import { ITEM_SPRITES   } from "../config/itemSprites.ts";
import { MINIGAME_TYPES } from "../config/minigameTypes.ts";
import type { ActiveItem, GameState } from "./types.ts";
import type { GameAssets            } from "./assets.ts";

const TYPES = Object.values(MINIGAME_TYPES);

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randPick<T>(arr: readonly T[]): T | undefined {
  return arr[Math.floor(Math.random() * arr.length)];
}

function computeItemSize(w: number): number {
  return w * (w < ITEM.LAYOUT.NARROW_WIDTH ? ITEM.LAYOUT.SIZE_PCT_NARROW : ITEM.LAYOUT.SIZE_PCT);
}

export function spawnItem(gameState: GameState, elapsedTime: number, w: number, h: number): void {
  const beltTop  = h - h * BELT.LAYOUT.HEIGHT_PCT;
  const itemSize = computeItemSize(w);

  let maxFaults = 1;
  if      (elapsedTime > GAME.TUNING.FAULTS_TIER_3_AT) maxFaults = 3;
  else if (elapsedTime > GAME.TUNING.FAULTS_TIER_2_AT) maxFaults = 2;

  const faults     = randInt(1, maxFaults);
  const faultTypes = Array.from({ length: faults }, () => randPick(TYPES) ?? TYPES[0]!);
  if (!faultTypes[0]) return;

  gameState.items.push({
    faults,
    totalFaults: faults,
    faultTypes,
    indicators:  faultTypes.map(faultType => ({ faultType, fixed: false })),
    x:    w + w * ITEM.LAYOUT.SPAWN_X_OFFSET_PCT,
    y:    beltTop - itemSize / 2,
    size: itemSize,
  });
}

export function moveItems(gameState: GameState, beltSpeed: number, w: number, dt: number): number {
  let missed = 0;
  for (let i = gameState.items.length - 1; i >= 0; i--) {
    const item = gameState.items[i];
    if (!item || item.paused) continue;
    item.x -= beltSpeed * w * BELT.TUNING.BASE_SCREENS_PER_SEC * dt;
    if (item.x < w * ITEM.LAYOUT.DESPAWN_X_PCT) {
      missed += item.faults;
      gameState.items.splice(i, 1);
    }
  }
  return missed;
}

export function removeItem(gameState: GameState, item: ActiveItem): void {
  const i = gameState.items.indexOf(item);
  if (i !== -1) gameState.items.splice(i, 1);
}

export function getItemAt(items: ActiveItem[], px: number, py: number): ActiveItem | null {
  for (const item of items) {
    const half = item.size / 2;
    if (px >= item.x - half && px <= item.x + half &&
        py >= item.y - half && py <= item.y + half) return item;
  }
  return null;
}

export function renderItems(
  ctx:    CanvasRenderingContext2D,
  items:  ActiveItem[],
  assets: GameAssets,
): void {
  for (const item of items) {
    const { x, y, size, faultTypes, indicators } = item;
    const spriteKey = faultTypes.length === 1 ? ITEM_SPRITES[faultTypes[0] ?? ""] : undefined;
    const bgImg     = spriteKey ? assets.items[spriteKey] : assets.items.background;

    ctx.drawImage(bgImg, x - size/2, y - size/2, size, size);

    if (!spriteKey) {
      for (let i = 0; i < indicators.length; i++) {
        const ind = indicators[i]!;
        const iy  = y + size * INDICATOR.LAYOUT.Y_START_PCT + i * size * INDICATOR.LAYOUT.SPACING_PCT;
        const iw  = size * INDICATOR.LAYOUT.WIDTH_PCT;
        const ih  = size * INDICATOR.LAYOUT.HEIGHT_PCT;
        const insertImg = ind.fixed ? assets.game.rectInsertFixed : assets.game.rectInsertFault;
        ctx.drawImage(insertImg,           x - iw/2, iy - ih/2, iw, ih);
        ctx.drawImage(assets.game.rectBorder, x - iw/2, iy - ih/2, iw, ih);
      }
    }
  }
}

export function resizeItems(gameState: GameState, w: number, h: number, oldW: number): void {
  const beltTop  = h - h * BELT.LAYOUT.HEIGHT_PCT;
  const itemSize = computeItemSize(w);
  const xScale   = w / oldW;

  for (const item of gameState.items) {
    item.x    *= xScale;
    item.y     = beltTop - itemSize / 2;
    item.size  = itemSize;
  }
}
