import { Scene } from 'phaser';
import { YouTubePlayables } from '../YouTubePlayables';
import { WaveDash } from '../WaveDash';
import { Audio } from '../Audio';

export class GameOver extends Scene {
  constructor () {
    super('GameOver');
  }

  create (data = {}) {
    this.audio = new Audio(this);
    this.audio.register("death", "sfx-death");
    this.audio.register("button", "sfx-button");
    this.audio.play("death");

    const score = data.score || 0;
    const time = data.time || 0;
    const highScore = this.registry.get("highScore") || 0;
    const isNewHigh = score > highScore;
    if (isNewHigh) this.registry.set("highScore", score);
 
    YouTubePlayables.sendScore(score);
    YouTubePlayables.saveData({
      highScore: isNewHigh ? score : highScore
    });
    WaveDash.submitScore(score);

    const { width, height } = this.scale;

    this.gameOverText = this.add.text(width / 2, height * 0.2, 'GAME OVER', {
      fontFamily: 'Arial', fontSize: '40px',
      color: '#ff4444', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.scoreText = this.add.text(width / 2, height * 0.35, `Score: ${score}`, {
      fontFamily: 'Arial', fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.timeText = this.add.text(width / 2, height * 0.45, `Time: ${time}s`, {
      fontFamily: 'Arial', fontSize: '20px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    if (isNewHigh) {
      this.newHighText = this.add.text(width / 2, height * 0.55, 'NEW HIGH SCORE!', {
        fontFamily: 'Arial', fontSize: '24px',
        color: '#ffcc00', fontStyle: 'bold'
      }).setOrigin(0.5);
    }

    // Play again
    this.playBtn = this.add.text(width / 2, height * 0.7, 'PLAY AGAIN', {
      fontFamily: 'Arial', fontSize: '28px',
      color: '#00cc66', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.playBtn.on('pointerover', () => this.playBtn.setColor('#00ff88'));
    this.playBtn.on('pointerout', () => this.playBtn.setColor('#00cc66'));
    this.playBtn.on('pointerdown', () => {
      this.audio.play("button");
      this.scene.start('Game');
    });

    this.menuBtn = this.add.text(width / 2, height * 0.8, 'MENU', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#888888'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.menuBtn.on('pointerover', () => this.menuBtn.setColor('#bbbbbb'));
    this.menuBtn.on('pointerout', () => this.menuBtn.setColor('#888888'));
    this.menuBtn.on('pointerdown', () => {
      this.audio.play("button");
      this.scene.start('MainMenu');
    });

    // Handle resize
    this.scale.on('resize', this.handleResize, this);

    this.events.once("shutdown", this.shutdown, this);
  }

  handleResize (gameSize) {
    const { width, height } = gameSize;
    this.gameOverText.setPosition(width / 2, height * 0.2);
    this.scoreText.setPosition(width / 2, height * 0.35);
    this.timeText.setPosition(width / 2, height * 0.45);
    this.newHighText?.setPosition(width / 2, height * 0.55);
    this.playBtn.setPosition(width / 2, height * 0.7);
    this.menuBtn.setPosition(width / 2, height * 0.8);
  }

  shutdown () {
    this.scale.off("resize", this.handleResize, this);
  }
}
