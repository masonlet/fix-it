import { DEPTH }     from "../config/depth.ts";
import { POPUP }     from "../config/popup.ts";
import { TIMER }     from "../config/timer.ts";
import { INDICATOR } from "../config/indicator.ts";

import { MINIGAME }       from "../config/minigame.ts";
import { MINIGAME_TYPES } from "../config/minigameTypes.ts";

import type { MinigameScene, ActiveItem } from "./types.ts";
import { TapMinigame }    from "../minigames/tapMinigame.ts";
import { PumpMinigame }   from "../minigames/pumpMinigame.ts";
import { DragMinigame }   from "../minigames/dragMinigame.ts";
import { SpinMinigame }   from "../minigames/spinMinigame.ts";
import { SwipeMinigame }  from "../minigames/swipeMinigame.ts";
import { TimingMinigame } from "../minigames/timingMinigame.ts";

interface MinigameInstance {
  destroy(): void;
  update?(delta: number): void;
  onResize?(width: number, height: number): void;
}

type MinigameConstructor = new (
  scene: MinigameScene,
  cx: number,
  cy: number,
  onComplete: () => void,
  onFail: () => void
) => MinigameInstance;

const MINIGAMES: Record<string, MinigameConstructor> = {
  [MINIGAME_TYPES.TAP]: TapMinigame,
  [MINIGAME_TYPES.PUMP]: PumpMinigame,
  [MINIGAME_TYPES.DRAG]: DragMinigame,
  [MINIGAME_TYPES.SPIN]: SpinMinigame,
  [MINIGAME_TYPES.SWIPE]: SwipeMinigame,
  [MINIGAME_TYPES.TIMING]: TimingMinigame,
};

export class MinigameManager {
  private scene:    MinigameScene;
  private timeMax:  number;
  private timeLeft: number;
  private activeItem:      ActiveItem       | null;
  private currentMinigame: MinigameInstance | null;
  
  private overlay:    Phaser.GameObjects.Rectangle | null;
  private popup:      Phaser.GameObjects.Rectangle | null;
  private timerBarBg: Phaser.GameObjects.Rectangle | null;
  private timerBar:   Phaser.GameObjects.Rectangle | null;

  constructor(scene: MinigameScene) {
    this.scene           = scene;
    this.activeItem      = null;
    this.currentMinigame = null;
    this.overlay         = null;
    this.popup           = null;
    this.timerBarBg      = null;
    this.timerBar        = null;
    this.timeLeft        = 0;
    this.timeMax         = MINIGAME.TUNING.TIME_MAX_START;
  }

  public get isActive(): boolean {
    return this.activeItem !== null;
  }

  public open(item: ActiveItem): void {
    const { width, height } = this.scene.scale;
    this.activeItem = item;
    this.scene.audio.play('click');
    item.paused = true;

    // Overlay
    this.overlay = this.scene.add.rectangle(
      width / 2, height / 2, width, height,
      POPUP.COLOUR.OVERLAY_FILL, POPUP.COLOUR.OVERLAY_ALPHA
    ).setDepth(DEPTH.OVERLAY);

    // Timer
    const barWidth   = width * TIMER.LAYOUT.BAR_WIDTH_PCT;
    const barHeight  = height * TIMER.LAYOUT.BAR_HEIGHT_PCT;
    const barYOffset = height * TIMER.LAYOUT.BAR_Y_OFFSET_PCT;
    this.timerBarBg  = this.scene.add.rectangle(
      width / 2, height - barYOffset,
      barWidth, barHeight,
      TIMER.COLOUR.BG_FILL
    ).setStrokeStyle(TIMER.LAYOUT.BAR_STROKE_WIDTH, TIMER.COLOUR.BG_STROKE)
     .setDepth(DEPTH.TIMER_BG);

    this.timerBar = this.scene.add.rectangle(
      width / 2 - barWidth / 2, height - barYOffset,
      barWidth, barHeight,
      TIMER.COLOUR.BAR_FILL
    ).setOrigin(0, 0.5).setDepth(DEPTH.TIMER_BAR);

    // Minigame
    const minigameType  = item.faultTypes[item.totalFaults - item.faults] as keyof typeof MINIGAMES;
    const MinigameClass = MINIGAMES[minigameType];
    if (!MinigameClass) throw new Error("Invalid minigame type");

    this.currentMinigame = new MinigameClass(
      this.scene,
      width / 2, height / 2,
      () => this.fix(),
      () => this.fail()
    );

    this.timeLeft = this.timeMax;
  }

  public update(delta: number): { failed: boolean } | null {
    if (!this.activeItem || this.timeLeft <= 0) return null;
    if (this.currentMinigame?.update) this.currentMinigame.update(delta);
    if (!this.activeItem) return null;

    this.timeLeft -= delta / 1000;
    const pct = Math.max(0, this.timeLeft / this.timeMax);
    this.timerBar?.setScale(pct, 1);

    if (this.timeLeft <= 0) {
      this.fail();
      return { failed: true };
    }

    return null;
  }

  public fix(): { fixed: boolean; complete: boolean; item: ActiveItem } | undefined {
    if (!this.activeItem) return;

    const item = this.activeItem;
    item.faults--;

    const fixedIndex = item.totalFaults - item.faults - 1;
    if (item.indicators[fixedIndex]) item.indicators[fixedIndex].insert.setTint(INDICATOR.COLOUR.FIXED);

    const result = { fixed: true, complete: item.faults <= 0, item };
    if (!result.complete) item.paused = false;
    else if (this.scene.onFixComplete) this.scene.onFixComplete(result);

    this.close();
    return result;
  }

  public fail (): void {
    if (!this.activeItem) return;
    this.scene.audio.play("fail");
    this.activeItem.paused = false;
    this.close();
  }

  public close (): void {
    this.overlay?.destroy();    this.overlay = null;
    this.popup?.destroy();      this.popup  = null;
    this.timerBarBg?.destroy(); this.timerBarBg = null;
    this.timerBar?.destroy();   this.timerBar = null;
    this.activeItem = null;
    if (this.currentMinigame) {
      this.currentMinigame.destroy();
      this.currentMinigame = null;
    }
  }

  public set maxTime(value: number) { this.timeMax = value; }

  public handleResize(width: number, height: number): void {
    if (!this.activeItem) return;
    const barWidth = width * TIMER.LAYOUT.BAR_WIDTH_PCT;
    const barHeight = height * TIMER.LAYOUT.BAR_HEIGHT_PCT;
    const barYOffset = height * TIMER.LAYOUT.BAR_Y_OFFSET_PCT;
    this.overlay?.setPosition(width / 2, height / 2).setSize(width, height);
    this.popup?.setPosition(width / 2, height / 2).setSize(
      width * POPUP.LAYOUT.WIDTH_PCT, height * POPUP.LAYOUT.HEIGHT_PCT
    );
    this.timerBarBg?.setPosition(width / 2, height - barYOffset).setSize(barWidth, barHeight);
    this.timerBar?.setPosition(width / 2 - barWidth / 2, height - barYOffset).setSize(barWidth, barHeight);
    const pct = Math.max(0, this.timeLeft / this.timeMax);
    this.timerBar?.setScale(pct, 1);
    this.currentMinigame?.onResize?.(width, height);
  }
}

