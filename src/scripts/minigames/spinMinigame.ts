import { DEPTH } from "../config/depth.ts";
import type { MinigameScene } from "./types.ts";

const TUNING = {
  REQUIRED_ROTATION_DEG: 2000,
}

const LAYOUT = {
  NARROW_WIDTH: 650,
  PIPE_SIZE_PCT:   0.40,
  VALVE_SIZE_PCT:  0.40,
  RING_RADIUS_PCT: 0.15,
  RING_THICKNESS_PCT: 0.015,
  PIPE_SIZE_PCT_NARROW:      0.80,
  VALVE_SIZE_PCT_NARROW:     0.80,
  RING_RADIUS_PCT_NARROW:    0.28,
  RING_THICKNESS_PCT_NARROW: 0.025,
}

const COLOUR = {
  RING_BG: 0x222222,
  RING_FILL: 0x00cc66,
}

export class SpinMinigame {
  public static useDefaultPopup = false;

  private scene:      MinigameScene;
  private onComplete: () => void;
  private cx: number;
  private cy: number;
  private accumulatedDeg: number;
  private lastAngle:      number | null;
  private hintVisible:    boolean;
  private pointerDown:    boolean;
  private completed:      boolean;
  private lastDrawnPct:   number;
  private spinIdleTimer:  Phaser.Time.TimerEvent | null;

  private ringRadius:    number;
  private ringThickness: number;

  private pipe:      Phaser.GameObjects.Image;
  private valve:     Phaser.GameObjects.Image;
  private ring:      Phaser.GameObjects.Graphics;
  private hint:      Phaser.GameObjects.Graphics | null;
  private hintTween: Phaser.Tweens.Tween         | null;

  private onPointerDown: (pointer: Phaser.Input.Pointer) => void;
  private onPointerMove: (pointer: Phaser.Input.Pointer) => void;
  private onPointerUp:   () => void;

  constructor (scene: MinigameScene, cx: number, cy: number, onComplete: () => void) {
    this.scene      = scene;
    this.onComplete = onComplete;
    this.cx = cx;
    this.cy = cy;
    this.accumulatedDeg = 0;
    this.lastAngle      = null;
    this.hintVisible    = true;
    this.pointerDown    = false;
    this.completed      = false;
    this.lastDrawnPct   = 0;
    this.spinIdleTimer  = null;

    const { width } = scene.scale;
    const { pipeSize, valveSize, ringRadius, ringThickness } = this.computeSizes(width);
    this.ringRadius = ringRadius;
    this.ringThickness = ringThickness;

    // Pipe
    this.pipe = scene.add.image(cx, cy, "spin-pipe")
      .setDisplaySize(pipeSize, pipeSize)
      .setDepth(DEPTH.MINIGAME);

    // Valve
    this.valve = scene.add.image(cx, cy, "spin-valve")
      .setDisplaySize(valveSize, valveSize)
      .setDepth(DEPTH.MINIGAME);

    // Progress ring
    this.ring = scene.add.graphics().setDepth(DEPTH.MINIGAME);
    this.drawRing(0);

    this.onPointerDown = (p) => {
      this.pointerDown = true;
      this.lastAngle = Math.atan2(p.y - this.cy, p.x - this.cx);
    };
    this.onPointerMove = (p) => this.handleMove(p);
    this.onPointerUp = () => {
      this.pointerDown = false;
      this.lastAngle = null;
    };

    // Hint
    this.hint = this.drawHint();
    this.hintTween = this.scene.tweens.add({
      targets: this.hint,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    scene.input.on("pointerdown", this.onPointerDown);
    scene.input.on("pointermove", this.onPointerMove);
    scene.input.on("pointerup", this.onPointerUp);
  }

  private handleMove(pointer: Phaser.Input.Pointer): void {
    if (!this.pointerDown || this.completed) return;

    const angle = Math.atan2(pointer.y - this.cy, pointer.x - this.cx);
    if (this.lastAngle !== null) {
      let delta = angle - this.lastAngle;
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;

      if (delta > 0) {
        this.startSpinSound();
        if (this.hintVisible) this.hideHint();
        const deltaDeg = delta * 180 / Math.PI;
        this.accumulatedDeg += deltaDeg;
        this.valve.rotation += delta;
        const pct = Math.min(1, this.accumulatedDeg / TUNING.REQUIRED_ROTATION_DEG);
        if (Math.abs(pct - this.lastDrawnPct) >= 0.005) {
          this.drawRing(pct);
          this.lastDrawnPct = pct;
        }
        if (pct >= 1) {
          this.stopSpinSound();
          this.completed = true;
          this.scene.audio.play("spin-complete");
          this.onComplete();
        }
      }
    }
    this.lastAngle = angle;
  }

  private startSpinSound(): void {
    const sound = this.scene.audio.sounds["spin-turn"];
    if (!sound?.isPlaying) {
      this.scene.audio.play("spin-turn", { loop: true });
    }
    this.spinIdleTimer?.remove();
    this.spinIdleTimer = this.scene.time.delayedCall(150, () => this.stopSpinSound());
  }

  private stopSpinSound(): void {
    this.scene.audio.stop("spin-turn");
  }

  private drawRing(pct: number): void {
    this.ring.clear();

    // Background ring
    this.ring.lineStyle(this.ringThickness, COLOUR.RING_BG);
    this.ring.strokeCircle(this.cx, this.cy, this.ringRadius);

    // Progress arc
    if (pct > 0) {
      this.ring.lineStyle(this.ringThickness, COLOUR.RING_FILL);
      this.ring.beginPath();
      this.ring.arc(
        this.cx, this.cy, this.ringRadius,
        -Math.PI / 2,
        -Math.PI / 2 + pct * 2 * Math.PI,
        false
      );
      this.ring.strokePath();
    }
  }

  private drawHint(): Phaser.GameObjects.Graphics {
    const g = this.scene.add.graphics().setDepth(DEPTH.MINIGAME);
    const hintRadius = this.ringRadius * 1.3;
    const startAngle = -Math.PI / 2;
    const endAngle = 0;

    // Curved line
    g.lineStyle(this.ringThickness, 0xffffff);
    g.beginPath();
    g.arc(this.cx, this.cy, hintRadius, startAngle, endAngle, false);
    g.strokePath();

    // Arrowhead
    const tipX = this.cx + hintRadius * Math.cos(endAngle);
    const tipY = this.cy + hintRadius * Math.sin(endAngle);
    const arrowSize = this.ringThickness * 3;
    g.fillStyle(0xffffff);
    g.fillTriangle(
      tipX, tipY + arrowSize,
      tipX - arrowSize, tipY - arrowSize / 2,
      tipX + arrowSize, tipY - arrowSize / 2
    );

    return g;
  }

  private hideHint(): void {
    if (!this.hintVisible) return;
    this.hintVisible = false;
    this.hintTween?.stop();
    this.hint?.destroy();
  }

  public destroy(): void {
    this.scene.input.off("pointerdown", this.onPointerDown);
    this.scene.input.off("pointermove", this.onPointerMove);
    this.scene.input.off("pointerup",   this.onPointerUp  );
    this.pipe.destroy();
    this.valve.destroy();
    this.ring.destroy();
    this.hintTween?.stop();
    this.hint?.destroy();
    this.stopSpinSound();
    this.spinIdleTimer?.remove();
  }

  public onResize(width: number, height: number): void {
    this.cx = width / 2;
    this.cy = height / 2;
    const { pipeSize, valveSize, ringRadius, ringThickness } = this.computeSizes(width);
    this.ringRadius = ringRadius;
    this.ringThickness = ringThickness;

    this.pipe.setPosition(this.cx, this.cy).setDisplaySize(pipeSize, pipeSize);
    this.valve.setPosition(this.cx, this.cy).setDisplaySize(valveSize, valveSize);
    const pct = Math.min(1, this.accumulatedDeg / TUNING.REQUIRED_ROTATION_DEG);
    this.drawRing(pct);

    if (this.hintVisible) {
      this.hint?.destroy();
      this.hint = this.drawHint();
      this.hintTween?.stop();
      this.hintTween = this.scene.tweens.add({
        targets: this.hint,
        alpha: { from: 1, to: 0.3 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  private computeSizes(width: number) {
    const narrow = width < LAYOUT.NARROW_WIDTH;
    return {
      pipeSize: width * (narrow ? LAYOUT.PIPE_SIZE_PCT_NARROW : LAYOUT.PIPE_SIZE_PCT),
      valveSize: width * (narrow ? LAYOUT.VALVE_SIZE_PCT_NARROW : LAYOUT.VALVE_SIZE_PCT),
      ringRadius: width * (narrow ? LAYOUT.RING_RADIUS_PCT_NARROW : LAYOUT.RING_RADIUS_PCT),
      ringThickness: width * (narrow ? LAYOUT.RING_THICKNESS_PCT_NARROW : LAYOUT.RING_THICKNESS_PCT),
    };
  }
}
