//import { Scene } from "phaser";

import { HUD } from "../config/hud.ts";

export class Hud {
  private scene: /*Scene*/;
  private lives: number;
  private width: number;
  private iconImages: /*Phaser.GameObjects.Image[]*/;
  private livesText:  /*Phaser.GameObjects.Text*/;
  private scoreText:  /*Phaser.GameObjects.Text*/;

  constructor (/*scene: Scene*/) {
    this.scene = scene;
    this.lives = 0;
    this.width = scene.scale.width;
    this.iconImages = [];

    this.livesText = scene.add.text(this.width * HUD.LAYOUT.LIVES_X_PCT, HUD.LAYOUT.Y, "", {
      fontFamily: "Arial",
      fontSize: HUD.LAYOUT.LIVES_FONT_SIZE,
      color: HUD.COLOUR.LIVES
    }).setOrigin(0.5, 0);

    this.scoreText = scene.add.text(this.width * HUD.LAYOUT.SCORE_X_PCT, HUD.LAYOUT.Y, "", {
      fontFamily: "Arial",
      fontSize: HUD.LAYOUT.SCORE_FONT_SIZE,
      color: HUD.COLOUR.SCORE
    }).setOrigin(0.5, 0);
  }

  setLives (lives: number): void {
    this.lives = lives;
    this.#renderLives();
  }

  #renderLives (): void {
    this.iconImages.forEach(img => img.destroy());
    this.iconImages = [];

    const compact = this.width < HUD.LAYOUT.COMPACT_WIDTH;
    if (compact) {
      this.livesText.setText(`x ${this.lives}`);
      const iconSize = HUD.LAYOUT.ICON_SIZE;
      const x = this.width * HUD.LAYOUT.LIVES_X_PCT - this.livesText.width / 2 - iconSize / 2;
      const icon = this.scene.add.image(x, HUD.LAYOUT.Y + iconSize / 2, "life-icon")
        .setDisplaySize(iconSize, iconSize);
      this.iconImages.push(icon);
    } else {
      this.livesText.setText("");
      const iconSize = HUD.LAYOUT.ICON_SIZE;
      const spacing = iconSize * 1.1;
      const totalWidth = spacing * this.lives;
      const startX = this.width * HUD.LAYOUT.LIVES_X_PCT - totalWidth / 2 + iconSize / 2;
      for (let i = 0; i < this.lives; i++) {
        const icon = this.scene.add.image(startX + i * spacing, HUD.LAYOUT.Y + iconSize / 2, "life-icon")
          .setDisplaySize(iconSize, iconSize);
        this.iconImages.push(icon);
      }
    }
  }

  setScore (score: number): void {
    this.scoreText.setText(`Score: ${score}`);
  }

  handleResize (width: number): void {
    this.width = width;
    this.livesText.setPosition(width * HUD.LAYOUT.LIVES_X_PCT, HUD.LAYOUT.Y);
    this.scoreText.setPosition(width * HUD.LAYOUT.SCORE_X_PCT, HUD.LAYOUT.Y);
    this.#renderLives();
  }
}
