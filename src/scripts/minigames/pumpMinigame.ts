import { DEPTH } from "../config/depth.ts";
import { INDICATOR } from "../config/indicator.ts";
import type { MinigameScene } from "../game/types.ts";

const TUNING = {
  REQUIRED_DISTANCE_MULT: 4,
}

const LAYOUT = {
  NARROW_WIDTH: 650,
  PUMP_WIDTH_PCT:    0.20,
  PUMP_HEIGHT_PCT:   0.40,
  HANDLE_HEIGHT_PCT: 0.065,
  HANDLE_WIDTH_PCT:  0.70,
  BAR_WIDTH_PCT:     0.08,
  BAR_INSET_PCT:     0.85,
  HANDLE_BOTTOM_LIMIT_PCT:  0.85,
  PUMP_WIDTH_PCT_NARROW:    0.40,
  PUMP_HEIGHT_PCT_NARROW:   0.40,
  HANDLE_HEIGHT_PCT_NARROW: 0.065,
  BAR_WIDTH_PCT_NARROW:     0.15,
}

export class PumpMinigame {
  private scene: MinigameScene;
  private onComplete: () => void;
  private pumpedDistance: number;
  private lastHandleY: number | null;
  private pointerDown: boolean;
  private arrowsVisible: boolean;
  private pumpIdleTimer: Phaser.Time.TimerEvent | null;

  private pumpTop!: number;
  private pumpBottom!: number;
  private handleTop!: number;
  private handleBottom!: number;
  private barBottom!: number;
  private requiredDistance!: number;
  private handleHeight!: number;
  private pumpHeight!: number;

  private pumpBody: Phaser.GameObjects.Image;
  private arrowUp: Phaser.GameObjects.Triangle | null;
  private arrowDown: Phaser.GameObjects.Triangle | null;
  private arrowTween: Phaser.Tweens.Tween | null;
  private handleInsert: Phaser.GameObjects.Image;
  private handleBorder: Phaser.GameObjects.Image;
  private bar: Phaser.GameObjects.Image;
  private barBorder: Phaser.GameObjects.Image;

  private onPointerDown: (pointer: Phaser.Input.Pointer) => void;
  private onPointerMove: (pointer: Phaser.Input.Pointer) => void;
  private onPointerUp: () => void;

  constructor (scene: MinigameScene, cx: number, cy: number, onComplete: () => void) {
    this.scene = scene;
    this.onComplete = onComplete;
    this.pumpedDistance = 0;
    this.lastHandleY = null;
    this.pointerDown = false;
    this.arrowsVisible = true;
    this.pumpIdleTimer = null;

    const { width, height } = scene.scale;
    const { pumpWidth, pumpHeight, handleWidth, handleHeight, barWidth } = this.computeSizes(width, height);

    this.pumpTop = cy - pumpHeight / 2;
    this.pumpBottom = cy + pumpHeight / 2;

    this.handleTop = this.pumpTop;
    this.handleBottom = this.pumpTop + pumpHeight * LAYOUT.HANDLE_BOTTOM_LIMIT_PCT;

    this.barBottom = this.pumpBottom;

    this.requiredDistance = pumpHeight * TUNING.REQUIRED_DISTANCE_MULT;

    const pumpX = cx - (pumpWidth + barWidth) / 2 + pumpWidth / 2;
    const barX = pumpX + pumpWidth / 2 + barWidth / 2;

    // Pump body
    this.pumpBody = scene.add.image(pumpX, cy, "pump-body")
      .setDisplaySize(pumpWidth, pumpHeight)
      .setDepth(DEPTH.MINIGAME);

    // Arrows
    const arrowSize = pumpWidth * 0.15;
    const arrowX = pumpX - pumpWidth / 2 - arrowSize;

    this.arrowUp = scene.add.triangle(
      arrowX, cy - arrowSize,
      arrowSize / 2, 0,
      0, arrowSize,
      arrowSize, arrowSize,
      0xffffff
    ).setDepth(DEPTH.MINIGAME);

    this.arrowDown = scene.add.triangle(
      arrowX, cy + arrowSize,
      0, 0,
      arrowSize, 0,
      arrowSize / 2, arrowSize,
      0xffffff
    ).setDepth(DEPTH.MINIGAME).setAlpha(0.3);

    this.arrowTween = scene.tweens.add({
      targets: this.arrowDown,
      alpha: 1,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      onYoyo: () => { if (this.arrowUp) this.arrowUp.alpha = 0.3; },
      onRepeat: () => { if (this.arrowUp) this.arrowUp.alpha = 1; },
    });

     // Handle
    const handleY = this.handleTop + handleHeight / 2;
    this.handleInsert = scene.add.image(pumpX, handleY, "rectangle-insert")
      .setDisplaySize(handleWidth, handleHeight)
      .setTint(0x666666)
      .setDepth(DEPTH.MINIGAME);
    this.handleBorder = scene.add.image(pumpX, handleY, "rectangle-border")
      .setDisplaySize(handleWidth, handleHeight)
      .setDepth(DEPTH.MINIGAME);

    // Progress bar fill
    this.bar = scene.add.image(barX, this.barBottom, "rectangle-insert")
      .setOrigin(0.5, 1)
      .setTint(INDICATOR.COLOUR.FIXED)
      .setDepth(DEPTH.MINIGAME);
    this.bar.displayWidth = barWidth * LAYOUT.BAR_INSET_PCT;
    this.bar.displayHeight = 0;

    // Progress bar background
    this.barBorder = scene.add.image(barX, cy, "rectangle-border")
      .setDisplaySize(barWidth, pumpHeight)
      .setDepth(DEPTH.MINIGAME);

    this.handleHeight = handleHeight;
    this.pumpHeight = pumpHeight;

    this.onPointerDown = () => {
      this.pointerDown = true; 
      this.lastHandleY = this.handleInsert.y;
    };
    this.onPointerMove = (p) => this.handleMove(p);
    this.onPointerUp = () => { 
      this.pointerDown = false; 
      this.lastHandleY = null;
    };

    scene.input.on("pointerdown", this.onPointerDown);
    scene.input.on("pointermove", this.onPointerMove);
    scene.input.on("pointerup", this.onPointerUp);
  }

  private handleMove(pointer: Phaser.Input.Pointer): void {
    if (!this.pointerDown) return;

    const y = pointer.y;
    const halfHandle = this.handleHeight / 2;
    const clampedY = Phaser.Math.Clamp(y, this.handleTop + halfHandle, this.handleBottom - halfHandle);

    if (this.lastHandleY !== null && clampedY > this.lastHandleY) {
      this.startPumpSound();
      if (this.arrowsVisible) this.hideArrows();
      this.pumpedDistance += clampedY - this.lastHandleY;
      const pct = Math.min(1, this.pumpedDistance / this.requiredDistance);
      this.bar.displayHeight = this.pumpHeight * LAYOUT.BAR_INSET_PCT * pct;
      if (pct >= 1) {
        this.stopPumpSound();
        this.scene.audio.play("pump-complete");
        this.onComplete();
      }
    }
  
    this.handleInsert.y = clampedY;
    this.handleBorder.y = clampedY;
    this.lastHandleY = clampedY;
  }

  public destroy(): void {
    this.scene.input.off("pointerdown", this.onPointerDown);
    this.scene.input.off("pointermove", this.onPointerMove);
    this.scene.input.off("pointerup", this.onPointerUp);
    this.hideArrows();
    this.pumpBody.destroy();
    this.handleInsert.destroy();
    this.handleBorder.destroy();
    this.barBorder.destroy();
    this.bar.destroy();
    this.stopPumpSound();
    this.pumpIdleTimer?.remove();
  }

  private computeSizes(width: number, height: number) {
    const narrow = width < LAYOUT.NARROW_WIDTH;
    const pumpWidth = width * (narrow ? LAYOUT.PUMP_WIDTH_PCT_NARROW : LAYOUT.PUMP_WIDTH_PCT);
    return {
      pumpWidth,
      pumpHeight: height * (narrow ? LAYOUT.PUMP_HEIGHT_PCT_NARROW : LAYOUT.PUMP_HEIGHT_PCT),
      handleWidth: pumpWidth * LAYOUT.HANDLE_WIDTH_PCT,
      handleHeight: height * (narrow ? LAYOUT.HANDLE_HEIGHT_PCT_NARROW : LAYOUT.HANDLE_HEIGHT_PCT),
      barWidth: width * (narrow ? LAYOUT.BAR_WIDTH_PCT_NARROW : LAYOUT.BAR_WIDTH_PCT),
    };
  }

  private startPumpSound(): void {
    const sound = this.scene.audio.sounds["pump-down"];
    if (!sound?.isPlaying) {
      this.scene.audio.play("pump-down", { loop: true });
    }
    this.pumpIdleTimer?.remove();
    this.pumpIdleTimer = this.scene.time.delayedCall(150, () => this.stopPumpSound());
  }

  private stopPumpSound(): void {
    this.scene.audio.stop("pump-down");
  }

  public onResize(width: number, height: number): void {
    const cx = width / 2;
    const cy = height / 2;
    const { pumpWidth, pumpHeight, handleWidth, handleHeight, barWidth } = this.computeSizes(width, height);
    const pumpX = cx - (pumpWidth + barWidth) / 2 + pumpWidth / 2;
    const barX = pumpX + pumpWidth / 2 + barWidth / 2;

    const oldHandlePct = (this.handleInsert.y - (this.handleTop + this.handleHeight / 2)) /
                        ((this.handleBottom - this.handleHeight / 2) - (this.handleTop + this.handleHeight / 2));

    this.pumpTop = cy - pumpHeight / 2;
    this.pumpBottom = cy + pumpHeight / 2;
    this.handleTop = this.pumpTop;
    this.handleBottom = this.pumpTop + pumpHeight * LAYOUT.HANDLE_BOTTOM_LIMIT_PCT;
    this.barBottom = this.pumpBottom;
    this.requiredDistance = pumpHeight * TUNING.REQUIRED_DISTANCE_MULT;
    this.handleHeight = handleHeight;
    this.pumpHeight = pumpHeight;

    const handleMinY = this.handleTop + handleHeight / 2;
    const handleMaxY = this.handleBottom - handleHeight / 2;
    const handleY = isFinite(oldHandlePct)
      ? handleMinY + (handleMaxY - handleMinY) * Math.max(0, Math.min(1, oldHandlePct))
      : handleMinY;
    const pct = Math.min(1, this.pumpedDistance / this.requiredDistance);

    this.pumpBody.setPosition(pumpX, cy).setDisplaySize(pumpWidth, pumpHeight);
    this.handleInsert.setPosition(pumpX, handleY).setDisplaySize(handleWidth, handleHeight);
    this.handleBorder.setPosition(pumpX, handleY).setDisplaySize(handleWidth, handleHeight);
    this.barBorder.setPosition(barX, cy).setDisplaySize(barWidth, pumpHeight);
    this.bar.setPosition(barX, this.barBottom);
    this.bar.displayWidth = barWidth * LAYOUT.BAR_INSET_PCT;
    this.bar.displayHeight = pumpHeight * LAYOUT.BAR_INSET_PCT * pct;
  }

  private hideArrows(): void {
    if (!this.arrowsVisible) return;
    this.arrowsVisible = false;
    this.arrowTween?.stop();
    this.arrowUp?.destroy();
    this.arrowDown?.destroy();
  }
}
