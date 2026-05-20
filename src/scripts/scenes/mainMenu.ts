import { Scene            } from "phaser";
import { YouTubePlayables } from "../sdk/youTubePlayables.ts";
import { Audio } from "../game/audio.ts";

export class MainMenu extends Scene {
  private audio!:          Audio;
  private title!:          Phaser.GameObjects.Text;
  private highScoreText!:  Phaser.GameObjects.Text;
  private prompt!:         Phaser.GameObjects.Text;

  constructor () {
    super("MainMenu");
  }

  public create(): void {
    this.audio = new Audio(this);
    this.audio.register("button", "sfx-button");

    const { width, height } = this.scale;

    // Title
    this.title = this.add.text(width / 2, height * 0.35, "FIX IT!", {
      fontFamily: "Arial",
      fontSize: "64px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    // High Score
    const highScore = this.registry.get("highScore") || 0;
    this.highScoreText = this.add.text(width / 2, height * 0.5, `High Score: ${highScore}`, {
      fontFamily: "Arial",
      fontSize: "20px",
      color: "#aaaaaa"
    }).setOrigin(0.5);

    // Tap to start
    this.prompt = this.add.text(width / 2, height * 0.65, "TAP TO START", {
      fontFamily: "Arial",
      fontSize: "28px",
      color: "#00cc66",
      fontStyle: "bold"
    }).setOrigin(0.5);

    // Pulse animation on the prompt
    this.tweens.add({
      targets: this.prompt,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    this.input.on("pointerdown", () => {
      this.audio.play("button");
      this.scene.start("Game");
    });

    this.scale.on("resize", this.handleResize, this);

    YouTubePlayables.gameReady();

    this.events.once("shutdown", this.shutdown, this);
  }

  public handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    this.title.setPosition(width / 2, height * 0.35);
    this.highScoreText.setPosition(width / 2, height * 0.5);
    this.prompt.setPosition(width / 2, height * 0.65);
  }

  public shutdown(): void {
    this.scale.off("resize", this.handleResize, this);
  }
}
