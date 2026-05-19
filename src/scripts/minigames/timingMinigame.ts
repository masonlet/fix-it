import { DEPTH } from "../config/depth.ts";
import type { MinigameScene } from "./types.ts";

const LAYOUT = {
  GAUGE_SIZE_MULT:   2.4,
  ZONE_ARC_DEG:      60,
  RADIUS_PCT:        0.18,
  THICKNESS_PCT:     0.015,
  NEEDLE_LENGTH_PCT: 0.16,
  NEEDLE_WIDTH_PCT:  0.01,
}
const TUNING = {
  HITS_REQUIRED:  3,
  MISSES_ALLOWED: 3,
  ARC_START_DEG:  0,
  ARC_SWEEP_DEG:  360,
  NEEDLE_SPEED_DEG_PER_SEC: 300,
}
const COLOUR = {
  ZONE_FILL:   0x00cc66,
  NEEDLE_FILL: 0xffffff,
}

interface TargetZone {
  center: number;
}

export class TimingMinigame {
  private scene:      MinigameScene;
  private onComplete: () => void;
  private onFail:     () => void;
  private cx: number;
  private cy: number;

  private radius:       number;
  private thickness:    number;
  private needleLength: number;
  private needleWidth:  number;

  private arcStart: number;

  private needleAngle: number;
  private misses:      number;
  private hits:        number;
  private acceptInput: boolean;

  private zones:        TargetZone[];
  private zonesCleared: boolean[];

  private gauge:    Phaser.GameObjects.Image;
  private graphics: Phaser.GameObjects.Graphics;
  private needle:   Phaser.GameObjects.Rectangle;

  private onPointerDown: () => void;

  constructor(scene: MinigameScene, cx: number, cy: number, onComplete: () => void, onFail: () => void) {
    this.scene = scene;
    this.onComplete = onComplete;
    this.onFail = onFail;
    this.cx = cx;
    this.cy = cy;

    const { width } = scene.scale;
    this.radius       = width * LAYOUT.RADIUS_PCT;
    this.thickness    = width * LAYOUT.THICKNESS_PCT;
    this.needleLength = width * LAYOUT.NEEDLE_LENGTH_PCT;
    this.needleWidth  = width * LAYOUT.NEEDLE_WIDTH_PCT;

    this.arcStart = TUNING.ARC_START_DEG;
    this.misses      = 0;
    this.hits        = 0;
    this.acceptInput = true;
    this.needleAngle = this.arcStart;

    // Random zones
    this.zones = this.generateZones();
    this.zonesCleared = this.zones.map(() => false);

    // Gauge background
    const gaugeSize = this.radius * LAYOUT.GAUGE_SIZE_MULT;
    this.gauge = scene.add.image(cx, cy, "timing-gauge")
      .setDisplaySize(gaugeSize, gaugeSize)
      .setDepth(DEPTH.MINIGAME);

    // Green zone arcs
    this.graphics = scene.add.graphics().setDepth(DEPTH.MINIGAME);
    this.redraw();

    // Needle
    this.needle = scene.add.rectangle(
      cx, cy, this.needleWidth, this.needleLength, COLOUR.NEEDLE_FILL
    ).setOrigin(0.5, 1).setDepth(DEPTH.MINIGAME);
    this.updateNeedle();

    this.onPointerDown = () => {
      if (!this.acceptInput) return;
      this.handleTap();
    };
    scene.input.on("pointerdown", this.onPointerDown);
  }

  private generateZones(): TargetZone[] {
    const zones: TargetZone[] = [];
    const minGap = LAYOUT.ZONE_ARC_DEG + 10;
    let attempts = 0;
    while (zones.length < TUNING.HITS_REQUIRED && attempts < 50) {
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

  private redraw(): void {
    this.graphics.clear();
    this.graphics.lineStyle(this.thickness, COLOUR.ZONE_FILL);
    this.zones.forEach((z, i) => {
      if (this.zonesCleared[i]) return;
      const half = LAYOUT.ZONE_ARC_DEG / 2;
      this.graphics.beginPath();
      this.graphics.arc(this.cx, this.cy, this.radius,
        Phaser.Math.DegToRad(z.center - half),
        Phaser.Math.DegToRad(z.center + half),
        false);
      this.graphics.strokePath();
    });
  }

  private updateNeedle(): void {
    this.needle.rotation = Phaser.Math.DegToRad(this.needleAngle + 90);
  }

  private handleTap(): void {
    this.scene.audio.play("timing-click");
    const half = LAYOUT.ZONE_ARC_DEG / 2;
    let hitIndex = -1;
    this.zones.forEach((z, i) => {
      if (this.zonesCleared[i]) return;
      let delta = Math.abs(z.center - this.needleAngle);
      if (delta > 180) delta = 360 - delta;
      if (delta <= half) hitIndex = i;
    });
    if (hitIndex >= 0) {
      this.zonesCleared[hitIndex] = true;
      this.hits++;
      this.redraw();
      if (this.hits >= TUNING.HITS_REQUIRED) {
        this.acceptInput = false;
        this.scene.audio.play("timing-complete");
        this.onComplete();
      }
    } else {
      this.misses++;
      if (this.misses >= TUNING.MISSES_ALLOWED) {
        this.acceptInput = false;
        this.onFail();
      }
    }
  }

  public update(delta: number): void {
    const deltaDeg = TUNING.NEEDLE_SPEED_DEG_PER_SEC * (delta / 1000);
    this.needleAngle = (this.needleAngle + deltaDeg) % 360;
    this.updateNeedle();
  }

  public destroy(): void {
    this.scene.input.off("pointerdown", this.onPointerDown);
    this.gauge.destroy();
    this.graphics.destroy();
    this.needle.destroy();
  }

  public onResize(width: number, height: number): void {
    this.cx = width / 2;
    this.cy = height / 2;
    this.radius = width * LAYOUT.RADIUS_PCT;
    this.thickness = width * LAYOUT.THICKNESS_PCT;
    this.needleLength = width * LAYOUT.NEEDLE_LENGTH_PCT;
    this.needleWidth = width * LAYOUT.NEEDLE_WIDTH_PCT;

    const gaugeSize = this.radius * LAYOUT.GAUGE_SIZE_MULT;
    this.gauge.setPosition(this.cx, this.cy).setDisplaySize(gaugeSize, gaugeSize);
    this.needle.setPosition(this.cx, this.cy).setSize(this.needleWidth, this.needleLength);
    this.redraw();
  }
}
