import { Scene } from "phaser";
import { GAME  } from "../config/game.ts";
import { BELT  } from "../config/belt.ts";
import type { ActiveItem } from "../game/types.ts";
import { Audio           } from "../game/audio.ts";
import { Hud             } from "../game/hud.ts";
import { ConveyorBelt    } from "../game/conveyorBelt.ts";
import { ItemSpawner     } from "../game/itemSpawner.ts";
import { MinigameManager } from "../game/minigameManager.ts";
import { Difficulty      } from "../game/difficulty.ts";

const AUDIO_KEYS: string[] = [
  "oof", "click", "fail",
  "drag-connect",
  "tap-button",   "tap-complete",
  "spin-turn",    "spin-complete",
  "pump-down",    "pump-complete",
  "timing-click", "timing-complete",
  "swipe-move",   "swipe-complete",
];

export class Game extends Scene {
  // Gameplay Variables
  private elapsedTime!: number;
  private score!:       number;
  private lives!:       number;
  private beltSpeed!:   number;

  // Engine Subsystems
  public  audio!:      Audio;
  private hud!:        Hud;
  private belt!:       ConveyorBelt;
  private spawner!:    ItemSpawner;
  private minigame!:   MinigameManager;
  private difficulty!: Difficulty;

  // Scene Callback Hooks
  public onFixComplete?: (result: { fixed: boolean; complete: boolean; item: ActiveItem }) => void;

  constructor () {
    super("Game");
  }

  create () {
    // Variables
    this.elapsedTime = 0;
    this.score       = 0;
    this.lives       = GAME.TUNING.LIVES_START;
    this.beltSpeed   = BELT.TUNING.SPEED_BASE;

    // Systems
    this.hud = new Hud(this);
    this.hud.setLives(this.lives);
    this.hud.setScore(this.score);

    this.audio      = new Audio(this);
    this.belt       = new ConveyorBelt(this);
    this.spawner    = new ItemSpawner(this);
    this.minigame   = new MinigameManager(this);
    this.difficulty = new Difficulty();
    AUDIO_KEYS.forEach(key => this.audio.register(key, `sfx-${key}`));

    // Input
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.minigame.isActive) return;

      const item = this.spawner.getItemAt(pointer.x, pointer.y);
      if (item) this.minigame.open(item);
    });

    this.onFixComplete = (result) => {
      this.addScore(GAME.TUNING.SCORE_PER_FIX * result.item.totalFaults);
      this.spawner.removeItem(result.item);
    };

    // Resizing
    this.scale.on("resize", this.handleResize, this);

    this.events.once("shutdown", this.shutdown, this);
  }

  public override update(_time: number, delta: number): void {
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
    if (!this.minigame.isActive) this.minigame.maxTime = d.minigameTimeMax;
  }

  public loseLife(count = 1): void {
    this.audio.play("oof");
    this.lives = Math.max(0, this.lives - count);
    this.hud.setLives(this.lives);
    if (this.lives <= 0) this.gameOver();
  }

  public addScore(points: number): void {
    this.score += points;
    this.hud.setScore(this.score);
  }

  public gameOver(): void {
    this.scene.start("GameOver", {
      score: this.score,
      time: Math.floor(this.elapsedTime)
    });
  }

  public handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;
    this.hud.handleResize(width);
    this.belt.handleResize(width, height);
    this.minigame.handleResize(width, height);
    this.spawner.handleResize(width, height);
  }

  public shutdown(): void {
    this.scale.off("resize", this.handleResize, this);
    this.audio.stopAll();
  }
}
