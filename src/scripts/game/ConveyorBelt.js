import { DEPTH } from "../config/depth.ts";
import { BELT } from "../config/belt.ts";

export class ConveyorBelt {
  constructor (scene) {
    this.scene = scene;
    const { width, height } = scene.scale;
    const beltHeight = height * BELT.LAYOUT.HEIGHT_PCT;
    this.sprite = scene.add.tileSprite(
      width / 2, height - beltHeight / 2,
      width, beltHeight,
      "belt-tile"
    ).setDepth(DEPTH.BELT);
  }

  update (beltSpeed, delta) {
    this.sprite.tilePositionX += beltSpeed * this.scene.scale.width * BELT.TUNING.BASE_SCREENS_PER_SEC * (delta / 1000);
  }

  handleResize (width, height) {
    const beltHeight = height * BELT.LAYOUT.HEIGHT_PCT;
    this.sprite.setPosition(width / 2, height - beltHeight / 2);
    this.sprite.setSize(width, beltHeight);
  }
}
