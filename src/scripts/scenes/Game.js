import { Scene } from "phaser";

import { GAME } from "../config/game.ts";
import { BELT } from "../config/belt.ts";

import { Hud } from "../game/hud.ts";
import { ConveyorBelt } from "../game/conveyorBelt.ts";
import { ItemSpawner } from "../game/itemSpawner.ts";
import { MinigameManager } from "../game/MinigameManager";
import { Difficulty } from "../game/difficulty.ts";
import { Audio } from "../game/audio.ts";

const AUDIO_KEYS = [
  "oof", "click",
  "fail", "drag-connect", "tap-button", "tap-complete",
  "spin-turn", "spin-complete", "pump-down", "pump-complete",
  "timing-click", "timing-complete", "swipe-move", "swipe-complete",
];

export class Game extends Scene {
  constructor () {
    super("Game");
  }

  create () {
    // Variables
    this.elapsedTime = 0;
    this.score = 0;
    this.lives = GAME.TUNING.LIVES_START;
    this.beltSpeed = BELT.TUNING.SPEED_BASE;

    // Systems
    this.hud = new Hud(this);
    this.hud.setLives(this.lives);
    this.hud.setScore(this.score);
    this.belt = new ConveyorBelt(this);
    this.spawner = new ItemSpawner(this);
    this.minigame = new MinigameManager(this);
    this.difficulty = new Difficulty();
    this.audio = new Audio(this);
    AUDIO_KEYS.forEach(key => this.audio.register(key, `sfx-${key}`));

    // Input
    this.input.on("pointerdown", (pointer) => {
      if (this.minigame.isActive) return;
 
      const item = this.spawner.getItemAt(pointer.x, pointer.y);
      if (item) this.minigame.open(item);
    });

    this.onFixComplete = (result) => {
      this.addScore(GAME.TUNING.SCORE_PER_FIX * result.item.totalFaults);
      this.spawner.removeItem(result.item);
    }
    
    // Resizing
    this.scale.on("resize", this.handleResize, this);

    this.events.once("shutdown", this.shutdown, this);
  }

  update (time, delta) {
    this.elapsedTime += delta / 1000;

    // Belt
    this.belt.update(this.beltSpeed, delta);

    // Item Spawning
    this.spawner.update(delta, this.elapsedTime);

    // Item Movement
    const missed = this.spawner.moveItems(this.beltSpeed, delta);
    if (missed) this.loseLife(missed.faults);

    // Minigame
    this.minigame.update(delta);

    // Difficulty ramping based on this.elapsedTime
    const d = this.difficulty.update(this.elapsedTime);
    this.beltSpeed = d.beltSpeed;
    this.spawner.spawnInterval = d.spawnInterval;
    if (!this.minigame.isActive) this.minigame.timeMax = d.minigameTimeMax;
  }

  loseLife (count = 1) {
    this.audio.play("oof");
    this.lives = Math.max(0, this.lives - count);
    this.hud.setLives(this.lives);
    if (this.lives <= 0) this.gameOver();
  }

  addScore (points) {
    this.score += points;
    this.hud.setScore(this.score);
  }

  gameOver () {
    this.scene.start("GameOver", {
      score: this.score,
      time: Math.floor(this.elapsedTime)
    });
  }

  handleResize (gameSize) {
    const { width, height } = gameSize;
    this.hud.handleResize(width);
    this.belt.handleResize(width, height);
    this.minigame.handleResize(width, height);
    this.spawner.handleResize(width, height);
  }

  shutdown () {
    this.scale.off("resize", this.handleResize, this);
    this.audio.stopAll();
  }
}
