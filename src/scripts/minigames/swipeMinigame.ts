import { DEPTH } from "../config/depth.ts";
import type { MinigameScene } from "../game/types.ts";

const LAYOUT = {
  NARROW_WIDTH: 650,
  ARROW_SIZE_PCT:  0.05,
  SOCKET_Y_PCT:    0.45,
  NEW_BULB_Y_PCT:  0.85,
  LAMP_WIDTH_PCT:  0.40,
  LAMP_HEIGHT_PCT: 0.60,
  BULB_SIZE_PCT:   0.24,
  LAMP_WIDTH_PCT_NARROW:  0.7,
  LAMP_HEIGHT_PCT_NARROW: 0.4,
  BULB_SIZE_PCT_NARROW:   0.5,
}

const TUNING = {
  SWIPE_THRESHOLD_PCT:  0.15,
  ANIM_DURATION_MS:     300,
  BOUNCE_AMPLITUDE_PCT: 0.015,
  BOUNCE_PERIOD_MS:     1000,
}

const COLOUR = {
  BROKEN_TINT:  0x444444,
  FIXED_TINT:   0xffdd66,
  ARROW_BROKEN: 0xaa2222,
  ARROW_FIXED:  0x007733,
}

export class SwipeMinigame {
  private scene:      MinigameScene;
  private onComplete: () => void;
  private cx:    number;
  private cy:    number;
  private stage: number;
  private lastY: number | null;
  private pointerDown:   boolean;
  private pieceOffset:   number;
  private arrowsVisible: boolean;

  private bulbSize:  number;
  private arrowSize: number;
  private threshold: number;
  private socketY:   number;
  private newBulbY:  number;

  private lamp:        /*Phaser.GameObjects.Image*/;
  private bulbInsert!: /*Phaser.GameObjects.Image*/     | null;
  private bulbBorder!: /*Phaser.GameObjects.Image*/     | null;
  private arrows!:     /*Phaser.GameObjects.Container*/ | null;

  private arrowBounceTween: /*Phaser.Tweens.Tween*/ | null = null;
  private advanceTween:     /*Phaser.Tweens.Tween*/ | null = null;

  private onPointerDown: (pointer: /*Phaser.Input.Pointer*/) => void;
  private onPointerMove: (pointer: /*Phaser.Input.Pointer*/) => void;
  private onPointerUp:   () => void;

  constructor(scene: MinigameScene, cx: number, cy: number, onComplete: () => void) {
    this.scene = scene;
    this.onComplete = onComplete;
    this.cx = cx;
    this.cy = cy;
    this.stage = 1;
    this.lastY = null;
    this.pointerDown = false;
    this.pieceOffset = 0;
    this.arrowsVisible = true;

    const { width, height } = scene.scale;
    const { lampWidth, lampHeight, bulbSize } = this.computeSizes(width, height);

    this.bulbSize = bulbSize;
    this.arrowSize = width * LAYOUT.ARROW_SIZE_PCT;
    this.threshold = height * TUNING.SWIPE_THRESHOLD_PCT;
    this.socketY = height * LAYOUT.SOCKET_Y_PCT;
    this.newBulbY = height * LAYOUT.NEW_BULB_Y_PCT;

    this.lamp = scene.add.image(cx, cy, "swipe-light")
      .setDisplaySize(lampWidth, lampHeight)
      .setDepth(DEPTH.MINIGAME);

    this.spawnBroken();

    this.onPointerDown = (p) => {
      this.pointerDown = true;
      this.lastY = p.y;
    };
    this.onPointerMove = (p) => this.handleMove(p);
    this.onPointerUp = () => {
      this.pointerDown = false;
      this.lastY = null;
    };

    scene.input.on("pointerdown", this.onPointerDown);
    scene.input.on("pointermove", this.onPointerMove);
    scene.input.on("pointerup",   this.onPointerUp);
  }

  private spawnBroken(): void {
    this.bulbInsert = this.scene.add.image(this.cx, this.socketY, "swipe-bulb-insert")
      .setDisplaySize(this.bulbSize, this.bulbSize)
      .setTint(COLOUR.BROKEN_TINT)
      .setDepth(DEPTH.MINIGAME);
    this.bulbBorder = this.scene.add.image(this.cx, this.socketY, "swipe-bulb")
      .setDisplaySize(this.bulbSize, this.bulbSize)
      .setDepth(DEPTH.MINIGAME);

    this.arrows = this.drawArrows(this.cx, this.socketY + this.bulbSize / 2 + this.arrowSize, 1, COLOUR.ARROW_BROKEN);
    this.arrowBounceTween = this.startBounce(this.arrows, 1);
  }

  private spawnFixed(): void {
    this.bulbInsert = this.scene.add.image(this.cx, this.newBulbY, "swipe-bulb-insert")
      .setDisplaySize(this.bulbSize, this.bulbSize)
      .setTint(COLOUR.FIXED_TINT)
      .setDepth(DEPTH.MINIGAME);
    this.bulbBorder = this.scene.add.image(this.cx, this.newBulbY, "swipe-bulb")
      .setDisplaySize(this.bulbSize, this.bulbSize)
      .setDepth(DEPTH.MINIGAME);

    this.pieceOffset = 0;
    this.arrowsVisible = true;

    this.arrows = this.drawArrows(this.cx, this.newBulbY - this.bulbSize / 2, -1, COLOUR.ARROW_FIXED);
    this.arrowBounceTween = this.startBounce(this.arrows, -1);
  }

  private drawArrows(
    x: number,
    y: number,
    direction: number,
    color: number
  ): /*Phaser.GameObjects.Container*/ {
    const group = this.scene.add.container(x, y).setDepth(DEPTH.MINIGAME);
    const spacing = this.arrowSize * 0.8;
    for (let i = 0; i < 3; i++) {
      const tri = this.scene.add.triangle(
        0, i * spacing * direction,
        0, 0,
        this.arrowSize, 0,
        this.arrowSize / 2, this.arrowSize * direction,
        color
      ).setOrigin(0.5, direction > 0 ? 0 : 1);
      group.add(tri);
    }
    return group;
  }

  private startBounce(
    arrows: /*Phaser.GameObjects.Container*/,
    direction: number
  ): /*Phaser.Tweens.Tween*/ {
    const amplitude = this.scene.scale.height * TUNING.BOUNCE_AMPLITUDE_PCT;
    return this.scene.tweens.add({
      targets: arrows,
      y: arrows.y + amplitude * direction,
      duration: TUNING.BOUNCE_PERIOD_MS / 2,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private hideArrows(): void {
    if (!this.arrowsVisible) return;
    this.arrowsVisible = false;
    this.arrowBounceTween?.stop();
    this.arrows?.destroy();
  }

  private handleMove(pointer: /*Phaser.Input.Pointer*/): void {
    if (!this.pointerDown) return;
    if (this.lastY !== null) {
      const delta = pointer.y - this.lastY;
      const valid = this.stage === 1 ? delta > 0 : delta < 0;
      if (valid) {
        this.pieceOffset += Math.abs(delta);
        if (this.bulbInsert) this.bulbInsert.y += delta;
        if (this.bulbBorder) this.bulbBorder.y += delta;
        if (this.arrowsVisible) this.hideArrows();
        if (this.pieceOffset >= this.threshold) this.advance();
      }
    }
    this.lastY = pointer.y;
  }

  private advance(): void {
    this.scene.audio.play("swipe-move");
    this.pointerDown = false;
    this.lastY = null;
    if (this.stage === 1) {
      const targetY = this.scene.scale.height + this.bulbSize;
      this.advanceTween = this.scene.tweens.add({
        targets: [this.bulbInsert, this.bulbBorder],
        y: targetY,
        duration: TUNING.ANIM_DURATION_MS,
        onComplete: () => {
          if (this.bulbInsert) this.bulbInsert.destroy();
          if (this.bulbBorder) this.bulbBorder.destroy();
          this.bulbInsert = null;
          this.bulbBorder = null;
          this.stage = 2;
          this.spawnFixed();
        },
      });
    } else {
      this.advanceTween = this.scene.tweens.add({
        targets: [this.bulbInsert, this.bulbBorder],
        y: this.socketY,
        duration: TUNING.ANIM_DURATION_MS,
        onComplete: () => {
          this.scene.audio.play("swipe-complete");
          this.onComplete();
        },
      });
    }
  }

  public destroy(): void {
    this.scene.input.off("pointerdown", this.onPointerDown);
    this.scene.input.off("pointermove", this.onPointerMove);
    this.scene.input.off("pointerup",   this.onPointerUp);
    this.arrowBounceTween?.stop();
    this.advanceTween?.stop();
    this.lamp?.destroy();
    this.bulbInsert?.destroy();
    this.bulbBorder?.destroy();
    this.arrows?.destroy();
  }

  public onResize(width: number, height: number): void {
    this.cx = width / 2;
    this.cy = height / 2;

    this.threshold = height * TUNING.SWIPE_THRESHOLD_PCT;
    this.socketY = height * LAYOUT.SOCKET_Y_PCT;
    this.newBulbY = height * LAYOUT.NEW_BULB_Y_PCT;
    
    const {lampWidth, lampHeight, bulbSize } = this.computeSizes(width, height);
    this.bulbSize = bulbSize;
    this.lamp.setPosition(this.cx, this.cy).setDisplaySize(lampWidth, lampHeight);
    this.bulbInsert?.setDisplaySize(bulbSize, bulbSize);
    this.bulbBorder?.setDisplaySize(bulbSize, bulbSize);
  }

  private computeSizes(width: number, height: number) {
    const narrow = width < LAYOUT.NARROW_WIDTH;
    return {
      lampWidth: width * (narrow ? LAYOUT.LAMP_WIDTH_PCT_NARROW : LAYOUT.LAMP_WIDTH_PCT),
      lampHeight: height * (narrow ? LAYOUT.LAMP_HEIGHT_PCT_NARROW : LAYOUT.LAMP_HEIGHT_PCT),
      bulbSize: width * (narrow ? LAYOUT.BULB_SIZE_PCT_NARROW : LAYOUT.BULB_SIZE_PCT),
    };
  }
}
