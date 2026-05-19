import { DEPTH } from "../config/depth.ts";
import { INDICATOR } from "../config/indicator.ts";

const LAYOUT = {
  NARROW_WIDTH: 650,
  BOX_COUNT: 3,
  BOX_SIZE_PCT: 0.085,
  BOX_SIZE_PCT_NARROW: 0.15,
  BOX_SPACING_PCT: 0.10,
  BOX_SPACING_PCT_NARROW: 0.18,
  BG_SIZE_PCT: 0.4,
  BG_SIZE_PCT_NARROW: 0.7,
  BUTTON_Y_OFFSET_PCT: 0.15,
}

export class TapMinigame {
  static useDefaultPopup = false;

  constructor (scene, cx, cy, onComplete) {
    this.scene = scene;
    this.onComplete = onComplete;
    this.remaining = LAYOUT.BOX_COUNT;

    const width = scene.scale.width;
    const { bgSize, boxSize, spacing } = this.#computeSizes(width);
    const totalWidth = spacing * (LAYOUT.BOX_COUNT - 1);
    const startX = cx - totalWidth / 2;
    const buttonY = cy + bgSize * LAYOUT.BUTTON_Y_OFFSET_PCT;

    this.bg = scene.add.image(cx, cy, "tap-walkie")
      .setDisplaySize(bgSize, bgSize)
      .setDepth(DEPTH.MINIGAME);

    this.boxes = [];
    for (let i = 0; i < LAYOUT.BOX_COUNT; i++) {
      const x = startX + i * spacing;
      const insert = scene.add.image(x, buttonY, "square-insert")
        .setDisplaySize(boxSize, boxSize)
        .setTint(INDICATOR.COLOUR.FAULT)
        .setDepth(DEPTH.MINIGAME)
        .setInteractive();
      const border = scene.add.image(x, buttonY, "square-border")
        .setDisplaySize(boxSize, boxSize)
        .setDepth(DEPTH.MINIGAME);

      insert.on("pointerdown", () => this.#hit(insert));
      this.boxes.push({ insert, border });
    }
  }

  #hit (insert) {
    if (insert.fixed) return;
    insert.fixed = true;
    insert.setTint(INDICATOR.COLOUR.FIXED);
    this.scene.audio.play("tap-button");
    this.remaining--;
    if (this.remaining <= 0) {
      this.scene.audio.play("tap-complete");
      this.onComplete();
    }
  }

  destroy () {
    this.bg.destroy();
    this.boxes.forEach(b => {
      b.insert.destroy();
      b.border.destroy();
    });
  }

  onResize (width, height) {
    const cx = width / 2;
    const cy = height / 2;
    const { bgSize, boxSize, spacing } = this.#computeSizes(width);
    const totalWidth = spacing * (LAYOUT.BOX_COUNT - 1);
    const startX = cx - totalWidth / 2;
    const buttonY = cy + bgSize * LAYOUT.BUTTON_Y_OFFSET_PCT;
    
    this.bg.setPosition(cx, cy).setDisplaySize(bgSize, bgSize);
    this.boxes.forEach((b, i) => {
      const x = startX + i * spacing;
      b.insert.setPosition(x, buttonY).setDisplaySize(boxSize, boxSize);
      b.border.setPosition(x, buttonY).setDisplaySize(boxSize, boxSize);
    });
  }

  #computeSizes (width) {
    const narrow = width < LAYOUT.NARROW_WIDTH;
    return {
      bgSize: width * (narrow ? LAYOUT.BG_SIZE_PCT_NARROW : LAYOUT.BG_SIZE_PCT),
      boxSize: width * (narrow ? LAYOUT.BOX_SIZE_PCT_NARROW : LAYOUT.BOX_SIZE_PCT),
      spacing: width * (narrow ? LAYOUT.BOX_SPACING_PCT_NARROW : LAYOUT.BOX_SPACING_PCT),
    };
  }
}
