import { BELT } from "../config/belt.ts";

export interface BeltState {
  offsetX: number;
}

export function updateBelt(belt: BeltState, beltSpeed: number, w: number, dt: number): void {
  belt.offsetX += beltSpeed * w * BELT.TUNING.BASE_SCREENS_PER_SEC * dt;
}

export function renderBelt(
  ctx:   CanvasRenderingContext2D,
  belt:  BeltState,
  img:   HTMLImageElement,
  w:     number,
  h:     number,
): void {
  const beltH = h * BELT.LAYOUT.HEIGHT_PCT;
  const beltY = h - beltH;
  const tileW = img.width;
  const startX = -(belt.offsetX % tileW);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, beltY, w, beltH);
  ctx.clip();
  for (let x = startX; x < w; x += tileW) {
    ctx.drawImage(img, x, beltY, tileW, beltH);
  }
  ctx.restore();
}
