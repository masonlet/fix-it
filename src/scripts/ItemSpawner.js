import { DEPTH } from "./config/depth.ts";
import { BELT } from "./config/belt.ts";
import { ITEM } from "./config/item.ts";
import { GAME } from "./config/game.ts";
import { INDICATOR } from "./config/indicator.ts";
import { ITEM_SPRITES } from "./config/itemSprites.ts";
import { MINIGAME_TYPES } from "./config/minigameTypes.ts";
const TYPES = Object.values(MINIGAME_TYPES);

export class ItemSpawner {
  constructor (scene) {
    this.scene = scene;
    this.items = [];
    this.spawnTimer = 0;
    this.spawnInterval = GAME.TUNING.SPAWN_INTERVAL_START;
    this.width = scene.scale.width;
    this.height = scene.scale.height;
  }

  update (delta, elapsedTime) {
    this.spawnTimer += delta / 1000;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawn(elapsedTime);
    }
  }

  spawn  (elapsedTime) {
    const beltTop = this.height - (this.height * BELT.LAYOUT.HEIGHT_PCT);
    const itemSize = this.#computeItemSize(this.width);

    let maxFaults = 1;
    if      (elapsedTime > GAME.TUNING.FAULTS_TIER_3_AT) maxFaults = 3;
    else if (elapsedTime > GAME.TUNING.FAULTS_TIER_2_AT) maxFaults = 2;

    const faults = Phaser.Math.Between(1, maxFaults);
    const totalFaults = faults;

    const container = this.scene.add.container(
      this.width + this.width * ITEM.LAYOUT.SPAWN_X_OFFSET_PCT,
      beltTop - itemSize / 2
    ).setDepth(DEPTH.ITEMS);

    const faultTypes = Array.from(
      { length: faults },
      () => Phaser.Math.RND.pick(TYPES)
    );

    const spriteKey = faults === 1 ? ITEM_SPRITES[faultTypes[0]] : null;
    let bg;
    if (spriteKey) {
      bg = this.scene.add.image(0, 0, spriteKey)
        .setDisplaySize(itemSize, itemSize);
    } else {
      bg = this.scene.add.image(0, 0, "item-background")
        .setDisplaySize(itemSize, itemSize);
    }
    container.add(bg);

    const indicators = [];
    if (!spriteKey){
      for (let i = 0; i < faults; i++) {
        const y = itemSize * INDICATOR.LAYOUT.Y_START_PCT + (i * itemSize * INDICATOR.LAYOUT.SPACING_PCT);
        const indWidth = itemSize * INDICATOR.LAYOUT.WIDTH_PCT;
        const indHeight = itemSize * INDICATOR.LAYOUT.HEIGHT_PCT;
        
        const insert = this.scene.add.image(0, y, "rectangle-insert")
          .setDisplaySize(indWidth, indHeight)
          .setTint(INDICATOR.COLOUR.FAULT);
        const border = this.scene.add.image(0, y, "rectangle-border")
          .setDisplaySize(indWidth, indHeight);
        
        container.add(insert);
        container.add(border);
        indicators.push({insert, border});
      }
    }

    container.setSize(itemSize);

    this.items.push({ sprite: container, bg, faults, totalFaults, indicators, faultTypes });
  }

  moveItems (beltSpeed, delta) {
    const { width } = this.scene.scale;

    let missedFaults = 0;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (item.paused) continue;
      item.sprite.x -= beltSpeed * width * BELT.TUNING.BASE_SCREENS_PER_SEC * (delta / 1000);
      if (item.sprite.x < width * ITEM.LAYOUT.DESPAWN_X_PCT) {
        missedFaults += item.faults;
        item.sprite.destroy();
        this.items.splice(i, 1);
      }
    }
    return missedFaults > 0 ? { missed: true, faults: missedFaults } : null;
  }

  removeItem (item) {
    item.sprite.destroy();
    this.items.splice(this.items.indexOf(item), 1);
  }

  getItemAt (x, y) {
    for (const item of this.items) 
      if (item.sprite.getBounds().contains(x, y))
        return item;

    return null;
  }

  handleResize (width, height) {
    const itemSize = this.#computeItemSize(width);
    const beltTop = height - height * BELT.LAYOUT.HEIGHT_PCT;
    const y = beltTop - itemSize / 2;
    const oldWidth = this.width ?? width;
    const xScale = width / oldWidth;

    for (const item of this.items) {
      item.sprite.x *= xScale;
      item.sprite.y = y;
      item.sprite.setSize(itemSize, itemSize);
      item.bg.setDisplaySize(itemSize, itemSize);
      item.indicators.forEach((ind, i) => {
        const yPos = itemSize * INDICATOR.LAYOUT.Y_START_PCT + (i * itemSize * INDICATOR.LAYOUT.SPACING_PCT);
        const indWidth = itemSize * INDICATOR.LAYOUT.WIDTH_PCT;
        const indHeight = itemSize * INDICATOR.LAYOUT.HEIGHT_PCT;
        ind.insert.setPosition(0, yPos).setDisplaySize(indWidth, indHeight);
        ind.border.setPosition(0, yPos).setDisplaySize(indWidth, indHeight);
      });
    }

    this.width = width;
    this.height = height;
  }

  #computeItemSize (width) {
    const narrow = width < ITEM.LAYOUT.NARROW_WIDTH;
    return width * (narrow ? ITEM.LAYOUT.SIZE_PCT_NARROW : ITEM.LAYOUT.SIZE_PCT);
  }
}

