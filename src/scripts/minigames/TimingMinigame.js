import { DEPTH } from "../config/depth.ts";

const LAYOUT = {
  GAUGE_SIZE_MULT: 2.4,
  RADIUS_PCT: 0.18,
  THICKNESS_PCT: 0.015,
  NEEDLE_LENGTH_PCT: 0.16,
  NEEDLE_WIDTH_PCT: 0.01,
  ZONE_ARC_DEG: 60,
}
const TUNING = {
  HITS_REQUIRED: 3,
  MISSES_ALLOWED: 3,
  NEEDLE_SPEED_DEG_PER_SEC: 300,
  ARC_START_DEG: 0,
  ARC_SWEEP_DEG: 360,
}
const COLOUR = {
  ZONE_FILL: 0x00cc66,
  NEEDLE_FILL: 0xffffff,
}

export class TimingMinigame {
  static useDefaultPopup = false;

  constructor (scene, cx, cy, onComplete, onFail) {
    this.scene = scene;
    this.onComplete = onComplete;
    this.onFail = onFail;
    this.cx = cx;
    this.cy = cy;

    const { width } = scene.scale;
    this.radius = width * LAYOUT.RADIUS_PCT;
    this.thickness = width * LAYOUT.THICKNESS_PCT;
    this.needleLength = width * LAYOUT.NEEDLE_LENGTH_PCT;
    this.needleWidth = width * LAYOUT.NEEDLE_WIDTH_PCT;

    this.arcStart = TUNING.ARC_START_DEG;
    this.arcSweep = TUNING.ARC_SWEEP_DEG;
    this.arcEnd = this.arcStart + this.arcSweep;

    this.needleAngle = this.arcStart;
    this.needleDir = 1;
    this.misses = 0;
    this.hits = 0;
    this.acceptInput = true;

    // Random zones
    this.zones = this.#generateZones();
    this.zonesCleared = this.zones.map(() => false);

    // Gauge background
    const gaugeSize = this.radius * LAYOUT.GAUGE_SIZE_MULT;
    this.gauge = scene.add.image(cx, cy, "timing-gauge")
      .setDisplaySize(gaugeSize, gaugeSize)
      .setDepth(DEPTH.MINIGAME);

    // Green zone arcs
    this.graphics = scene.add.graphics().setDepth(DEPTH.MINIGAME);
    this.#redraw();

    // Needle
    this.needle = scene.add.rectangle(
      cx, cy, this.needleWidth, this.needleLength, COLOUR.NEEDLE_FILL
    ).setOrigin(0.5, 1).setDepth(DEPTH.MINIGAME);
    this.#updateNeedle();

    this.onPointerDown = () => {
      if (!this.acceptInput) return;
      this.#handleTap();
    };
    scene.input.on("pointerdown", this.onPointerDown);
  }

  #generateZones () {
    const zones = [];
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

  #redraw () {
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

  #updateNeedle () {
    this.needle.rotation = Phaser.Math.DegToRad(this.needleAngle + 90);
  }

  #handleTap () {
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
      this.#redraw();
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

  update (delta) {
    const deltaDeg = TUNING.NEEDLE_SPEED_DEG_PER_SEC * (delta / 1000);
    this.needleAngle = (this.needleAngle + deltaDeg) % 360;
    this.#updateNeedle();
  }

  destroy () {
    this.scene.input.off("pointerdown", this.onPointerDown);
    this.gauge.destroy();
    this.graphics.destroy();
    this.needle.destroy();
  }

  onResize (width, height) {
    this.cx = width / 2;
    this.cy = height / 2;
    this.radius = width * LAYOUT.RADIUS_PCT;
    this.thickness = width * LAYOUT.THICKNESS_PCT;
    this.needleLength = width * LAYOUT.NEEDLE_LENGTH_PCT;
    this.needleWidth = width * LAYOUT.NEEDLE_WIDTH_PCT;

    const gaugeSize = this.radius * LAYOUT.GAUGE_SIZE_MULT;
    this.gauge.setPosition(this.cx, this.cy).setDisplaySize(gaugeSize, gaugeSize);
    this.needle.setPosition(this.cx, this.cy).setSize(this.needleWidth, this.needleLength);
    this.#redraw();
  }
}
