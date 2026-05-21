import { HUD } from "../config/hud.ts";

export function renderHud(
  ctx:   CanvasRenderingContext2D,
  w:     number,
  lives: number,
  score: number,
  img:   HTMLImageElement,
): void {
  const compact   = w < HUD.LAYOUT.COMPACT_WIDTH;
  const livesX    = w * HUD.LAYOUT.LIVES_X_PCT;
  const scoreX    = w * HUD.LAYOUT.SCORE_X_PCT;
  const iconSize  = HUD.LAYOUT.ICON_SIZE;
  const y         = HUD.LAYOUT.Y;

  // Score
  ctx.fillStyle    = HUD.COLOUR.SCORE;
  ctx.font         = `${HUD.LAYOUT.SCORE_FONT_SIZE} Arial`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "top";
  ctx.fillText(`Score: ${score}`, scoreX, y);

  // Lives
  if (compact) {
    ctx.drawImage(img, livesX - iconSize, y, iconSize, iconSize);
    ctx.fillStyle = HUD.COLOUR.LIVES;
    ctx.font      = `${HUD.LAYOUT.LIVES_FONT_SIZE} Arial`;
    ctx.textAlign = "left";
    ctx.fillText(`x ${lives}`, livesX + iconSize * 0.1, y + iconSize * 0.1);
  } else {
    const spacing    = iconSize * 1.1;
    const totalWidth = spacing * lives;
    const startX     = livesX - totalWidth / 2 + iconSize / 2;
    for (let i = 0; i < lives; i++) {
      ctx.drawImage(img, startX + i * spacing - iconSize / 2, y, iconSize, iconSize);
    }
  }
}
